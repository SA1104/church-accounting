const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { query } = require('../db');
const jwt = require('jsonwebtoken');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const isMockMode = SUPABASE_URL.includes('your-supabase-project') || SUPABASE_URL.includes('booza-think');

// WebAuthn Relying Party settings with environmental config and localhost defaults
const rpName = process.env.WEBAUTHN_RP_NAME || 'BOOZA THINK';
const rpID = process.env.WEBAUTHN_RP_ID || 'booza-church-think.onrender.com';
const origin = process.env.WEBAUTHN_ORIGIN || 'https://booza-church-think.onrender.com';

// Log the configuration on module load
console.log('[WebAuthn Config]', {
  rpName,
  rpID,
  origin
});

// Helper: Convert string userId to simple Buffer for SimpleWebAuthn compatibility
function getUserIDBuffer(userId) {
  return Buffer.from(userId);
}

// 1. Registration Options
async function getRegisterOptions(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: getUserIDBuffer(user.id),
      userName: user.email,
      userDisplayName: user.name || user.username || user.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform' // Touch ID / Face ID / Windows Hello
      }
    });

    // Save challenge to db (expiring in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await query.run(
      'INSERT INTO public.passkey_challenges (user_id, challenge, type, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, options.challenge, 'registration', expiresAt]
    );

    return res.json(options);
  } catch (err) {
    console.error('[WebAuthn Register Options Error]', err);
    return res.status(500).json({ success: false, message: '생체인증 등록 옵션 생성 실패' });
  }
}

// 2. Registration Verification
async function verifyRegister(req, res) {
  try {
    const user = req.user;
    const { regResponse, deviceName } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    if (!regResponse) {
      return res.status(400).json({ success: false, message: '인증 응답이 누락되었습니다.' });
    }

    // Retrieve active challenge from DB
    const challengeRecord = await query.get(
      "SELECT * FROM public.passkey_challenges WHERE user_id = ? AND type = 'registration' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [user.id]
    );

    if (!challengeRecord) {
      return res.status(400).json({
        success: false,
        message: '인증 시간이 만료되었습니다. 다시 시도해 주세요.'
      });
    }

    // Verify response
    const verification = await verifyRegistrationResponse({
      response: regResponse,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;

      // Delete challenge
      await query.run('DELETE FROM public.passkey_challenges WHERE challenge = ?', [challengeRecord.challenge]);

      // Check if credential ID already registered
      const existing = await query.get(
        'SELECT * FROM public.passkey_credentials WHERE credential_id = ?',
        [credentialID]
      );
      if (existing) {
        return res.status(400).json({ success: false, message: '이미 등록된 기기입니다.' });
      }

      // Save credential
      await query.run(
        `INSERT INTO public.passkey_credentials (
          user_id, credential_id, public_key, counter, transports, device_name, backed_up, credential_device_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          credentialID,
          Buffer.from(credentialPublicKey).toString('base64'),
          counter,
          regResponse.response.transports || [],
          deviceName || '내 지문 기기',
          credentialBackedUp,
          credentialDeviceType
        ]
      );

      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: 'Passkey 등록 검증에 실패했습니다.' });
    }
  } catch (err) {
    console.error('[WebAuthn Register Verify Error]', err);
    return res.status(500).json({ success: false, message: '생체인증 기기 검증 오류가 발생했습니다.' });
  }
}

// 3. Login Options
async function getLoginOptions(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: '이메일을 입력해 주세요.' });
    }

    // Look up user by email or username
    const profile = await query.get(
      "SELECT user_id, username FROM public.platform_profiles WHERE username = ? OR username = ? OR email = ? LIMIT 1",
      [email, email.split('@')[0], email]
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: '등록되지 않은 사용자입니다.' });
    }

    // Get user credentials
    const credentials = await query.all(
      'SELECT credential_id, transports FROM public.passkey_credentials WHERE user_id = ?',
      [profile.user_id]
    );

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map(c => ({
        id: c.credential_id,
        type: 'public-key',
        transports: c.transports
      })),
      userVerification: 'preferred'
    });

    // Save challenge
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await query.run(
      'INSERT INTO public.passkey_challenges (user_id, challenge, type, expires_at) VALUES (?, ?, ?, ?)',
      [profile.user_id, options.challenge, 'authentication', expiresAt]
    );

    return res.json(options);
  } catch (err) {
    console.error('[WebAuthn Login Options Error]', err);
    return res.status(500).json({ success: false, message: '생체인증 로그인 옵션 생성 실패' });
  }
}

// 4. Login Verification
async function verifyLogin(req, res) {
  try {
    const { email, authResponse } = req.body;
    if (!email || !authResponse) {
      return res.status(400).json({ success: false, message: '필수 매개변수가 누락되었습니다.' });
    }

    // Look up user
    const profile = await query.get(
      "SELECT user_id, username, display_name FROM public.platform_profiles WHERE username = ? OR username = ? OR email = ? LIMIT 1",
      [email, email.split('@')[0], email]
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: '등록되지 않은 사용자입니다.' });
    }

    // Get active challenge
    const challengeRecord = await query.get(
      "SELECT * FROM public.passkey_challenges WHERE user_id = ? AND type = 'authentication' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [profile.user_id]
    );

    if (!challengeRecord) {
      return res.status(400).json({
        success: false,
        message: '인증 시간이 만료되었습니다. 다시 시도해 주세요.'
      });
    }

    // Get registered credential info
    const credentialRecord = await query.get(
      'SELECT * FROM public.passkey_credentials WHERE credential_id = ? AND user_id = ?',
      [authResponse.id, profile.user_id]
    );

    if (!credentialRecord) {
      return res.status(400).json({ success: false, message: '등록되지 않은 인증 기기입니다.' });
    }

    // Verify assertion
    const verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credentialRecord.credential_id,
        publicKey: Buffer.from(credentialRecord.public_key, 'base64'),
        counter: parseInt(credentialRecord.counter, 10)
      },
      requireUserVerification: false
    });

    if (verification.verified && verification.authenticationInfo) {
      // Delete challenge
      await query.run('DELETE FROM public.passkey_challenges WHERE challenge = ?', [challengeRecord.challenge]);

      // Update counter
      await query.run(
        'UPDATE public.passkey_credentials SET counter = ?, last_used_at = CURRENT_TIMESTAMP WHERE credential_id = ?',
        [verification.authenticationInfo.newCounter, credentialRecord.credential_id]
      );

      // Return token & user info
      let token;
      if (isMockMode) {
        // Return structured mock token payload for authtoken fallbacks
        token = `${profile.username}-uuid-placeholder-token`;
      } else {
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'your-supabase-jwt-secret';
        token = jwt.sign(
          {
            sub: profile.user_id,
            email: email.includes('@') ? email : `${profile.username}@boozathink.com`,
            role: 'authenticated',
            aud: 'authenticated',
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
          },
          jwtSecret
        );
      }

      return res.json({
        success: true,
        token,
        user: {
          id: profile.user_id,
          email: email.includes('@') ? email : `${profile.username}@boozathink.com`,
          user_metadata: { name: profile.display_name || profile.username }
        }
      });
    } else {
      return res.status(400).json({ success: false, message: '지문/Face ID 인증에 실패했습니다.' });
    }
  } catch (err) {
    console.error('[WebAuthn Login Verify Error]', err);
    return res.status(500).json({ success: false, message: '생체인증 로그인 처리 중 오류가 발생했습니다.' });
  }
}

// 5. Get Credentials
async function listCredentials(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const credentials = await query.all(
      'SELECT id, device_name, created_at, last_used_at, credential_device_type FROM public.passkey_credentials WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    return res.json(credentials);
  } catch (err) {
    console.error('[WebAuthn List Credentials Error]', err);
    return res.status(500).json({ success: false, message: '기기 목록 조회 실패' });
  }
}

// 6. Delete Credential
async function deleteCredential(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    await query.run(
      'DELETE FROM public.passkey_credentials WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[WebAuthn Delete Credential Error]', err);
    return res.status(500).json({ success: false, message: '기기 삭제 실패' });
  }
}

module.exports = {
  getRegisterOptions,
  verifyRegister,
  getLoginOptions,
  verifyLogin,
  listCredentials,
  deleteCredential
};
