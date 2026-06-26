const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'church.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const query = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

async function migrateDb() {
  try {
    // Disable foreign keys temporarily for migrations
    await query.run("PRAGMA foreign_keys = OFF;");

    // 1. Reconstruct users table if department_id exists
    const usersCheck = await query.all("PRAGMA table_info(users);");
    const usersColsCheck = usersCheck.map(col => col.name);
    if (usersColsCheck.includes('department_id')) {
      console.log('Migrating: Reconstructing users table to remove department_id...');
      await query.run("ALTER TABLE users RENAME TO users_old;");
      await query.exec(`
        CREATE TABLE users (
          user_id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          role TEXT NOT NULL,
          position TEXT NOT NULL DEFAULT '기타',
          group_id INTEGER REFERENCES groups(group_id) ON DELETE SET NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const hasPos = usersColsCheck.includes('position');
      const hasGrp = usersColsCheck.includes('group_id');
      await query.run(`
        INSERT INTO users (
          user_id, username, password_hash, name, email, role, position, group_id, is_active, created_at
        )
        SELECT 
          user_id, username, password_hash, name, email, role,
          ${hasPos ? 'position' : "'기타'"},
          ${hasGrp ? 'COALESCE(group_id, department_id)' : 'department_id'},
          is_active, created_at
        FROM users_old;
      `);
      await query.run("DROP TABLE users_old;");
      console.log('Migrated: users table reconstructed.');
    }

    // 2. Reconstruct vouchers table if department_id exists
    const vouchersCheck = await query.all("PRAGMA table_info(vouchers);");
    const vouchersColsCheck = vouchersCheck.map(col => col.name);
    if (vouchersColsCheck.includes('department_id')) {
      console.log('Migrating: Reconstructing vouchers table to remove department_id...');
      await query.run("ALTER TABLE vouchers RENAME TO vouchers_old;");
      await query.exec(`
        CREATE TABLE vouchers (
          voucher_id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL REFERENCES groups(group_id),
          writer_id INTEGER NOT NULL REFERENCES users(user_id),
          dept_head_approver_id INTEGER REFERENCES users(user_id),
          finance_approver_id INTEGER REFERENCES users(user_id),
          transaction_date TEXT NOT NULL,
          transaction_type TEXT NOT NULL,
          category_id INTEGER NOT NULL REFERENCES account_categories(category_id),
          summary TEXT NOT NULL,
          vendor TEXT,
          amount REAL NOT NULL,
          payment_method TEXT,
          status TEXT DEFAULT 'TEMP' NOT NULL,
          reject_reason TEXT,
          memo TEXT,
          has_attachment INTEGER DEFAULT 0,
          approved_at TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const hasGrp = vouchersColsCheck.includes('group_id');
      const hasDeptHead = vouchersColsCheck.includes('dept_head_approver_id');
      const hasFinance = vouchersColsCheck.includes('finance_approver_id');
      await query.run(`
        INSERT INTO vouchers (
          voucher_id, group_id, writer_id, dept_head_approver_id, finance_approver_id,
          transaction_date, transaction_type, category_id, summary, vendor,
          amount, payment_method, status, reject_reason, memo, has_attachment, approved_at, created_at
        )
        SELECT 
          voucher_id, 
          ${hasGrp ? 'COALESCE(group_id, department_id)' : 'department_id'}, 
          writer_id, 
          ${hasDeptHead ? 'dept_head_approver_id' : 'NULL'}, 
          ${hasFinance ? 'finance_approver_id' : 'NULL'},
          transaction_date, transaction_type, category_id, summary, vendor,
          amount, payment_method, status, reject_reason, memo, has_attachment, approved_at, created_at
        FROM vouchers_old;
      `);
      await query.run("DROP TABLE vouchers_old;");
      console.log('Migrated: vouchers table reconstructed.');
    }

    // 3. Reconstruct ledgers table if department_id exists
    const ledgersCheck = await query.all("PRAGMA table_info(ledgers);");
    const ledgersColsCheck = ledgersCheck.map(col => col.name);
    if (ledgersColsCheck.includes('department_id')) {
      console.log('Migrating: Reconstructing ledgers table to remove department_id...');
      await query.run("ALTER TABLE ledgers RENAME TO ledgers_old;");
      await query.exec(`
        CREATE TABLE ledgers (
          ledger_id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL REFERENCES groups(group_id),
          year_month TEXT NOT NULL,
          carry_over REAL DEFAULT 0.00 NOT NULL,
          total_income REAL DEFAULT 0.00 NOT NULL,
          total_expense REAL DEFAULT 0.00 NOT NULL,
          balance REAL DEFAULT 0.00 NOT NULL,
          status TEXT DEFAULT 'TEMP' NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (group_id, year_month)
        );
      `);
      const hasGrp = ledgersColsCheck.includes('group_id');
      await query.run(`
        INSERT INTO ledgers (
          ledger_id, group_id, year_month, carry_over, total_income, total_expense, balance, status, created_at
        )
        SELECT 
          ledger_id, 
          ${hasGrp ? 'COALESCE(group_id, department_id)' : 'department_id'}, 
          year_month, carry_over, total_income, total_expense, balance, status, created_at
        FROM ledgers_old;
      `);
      await query.run("DROP TABLE ledgers_old;");
      console.log('Migrated: ledgers table reconstructed.');
    }

    // 4. Reconstruct settlement_reports table if department_id exists
    const reportsCheck = await query.all("PRAGMA table_info(settlement_reports);");
    const reportsColsCheck = reportsCheck.map(col => col.name);
    if (reportsColsCheck.includes('department_id')) {
      console.log('Migrating: Reconstructing settlement_reports table to remove department_id...');
      await query.run("ALTER TABLE settlement_reports RENAME TO reports_old;");
      await query.exec(`
        CREATE TABLE settlement_reports (
          report_id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL REFERENCES groups(group_id),
          fiscal_year INTEGER NOT NULL,
          half_cycle TEXT NOT NULL,
          budget_amount REAL DEFAULT 0.00 NOT NULL,
          total_income REAL DEFAULT 0.00 NOT NULL,
          total_expense REAL DEFAULT 0.00 NOT NULL,
          balance REAL DEFAULT 0.00 NOT NULL,
          status TEXT DEFAULT 'TEMP' NOT NULL,
          note TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (group_id, fiscal_year, half_cycle)
        );
      `);
      const hasGrp = reportsColsCheck.includes('group_id');
      await query.run(`
        INSERT INTO settlement_reports (
          report_id, group_id, fiscal_year, half_cycle, budget_amount, total_income, total_expense, balance, status, note, created_at
        )
        SELECT 
          report_id, 
          ${hasGrp ? 'COALESCE(group_id, department_id)' : 'department_id'}, 
          fiscal_year, half_cycle, budget_amount, total_income, total_expense, balance, status, note, created_at
        FROM reports_old;
      `);
      await query.run("DROP TABLE reports_old;");
      console.log('Migrated: settlement_reports table reconstructed.');
    }

    // 4.5. Reconstruct tables that reference users_old or vouchers_old
    const attachmentsMaster = await query.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='voucher_attachments';");
    if (attachmentsMaster && attachmentsMaster.sql.includes('vouchers_old')) {
      console.log('Migrating: Reconstructing voucher_attachments to point to vouchers...');
      await query.run("ALTER TABLE voucher_attachments RENAME TO voucher_attachments_old;");
      await query.exec(`
        CREATE TABLE voucher_attachments (
          attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
          voucher_id INTEGER NOT NULL REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
          storage_provider TEXT DEFAULT 'LOCAL' NOT NULL,
          file_name TEXT NOT NULL,
          file_key TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT,
          ocr_raw_result TEXT,
          ocr_confidence REAL,
          ocr_status TEXT NOT NULL DEFAULT 'PENDING',
          ocr_result TEXT,
          tags TEXT,
          ocr_error TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await query.run(`
        INSERT INTO voucher_attachments (
          attachment_id, voucher_id, storage_provider, file_name, file_key, file_size, mime_type, ocr_raw_result, ocr_confidence, created_at, ocr_status, sort_order
        )
        SELECT 
          attachment_id, voucher_id, storage_provider, file_name, file_key, file_size, mime_type, ocr_raw_result, ocr_confidence, created_at, 'COMPLETED', 0
        FROM voucher_attachments_old;
      `);
      await query.run("DROP TABLE voucher_attachments_old;");
      console.log('Migrated: voucher_attachments table reconstructed.');
    }

    const historiesMaster = await query.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='approval_histories';");
    if (historiesMaster && historiesMaster.sql.includes('users_old')) {
      console.log('Migrating: Reconstructing approval_histories to point to users...');
      await query.run("ALTER TABLE approval_histories RENAME TO approval_histories_old;");
      await query.exec(`
        CREATE TABLE approval_histories (
          history_id INTEGER PRIMARY KEY AUTOINCREMENT,
          approval_id INTEGER NOT NULL REFERENCES approvals(approval_id) ON DELETE CASCADE,
          actor_id INTEGER NOT NULL REFERENCES users(user_id),
          action TEXT NOT NULL,
          step_number INTEGER NOT NULL,
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          signature TEXT
        );
      `);
      const hasSignature = historiesMaster.sql.toLowerCase().includes('signature');
      await query.run(`
        INSERT INTO approval_histories (
          history_id, approval_id, actor_id, action, step_number, comment, created_at, signature
        )
        SELECT 
          history_id, approval_id, actor_id, action, step_number, comment, created_at,
          ${hasSignature ? 'signature' : 'NULL'}
        FROM approval_histories_old;
      `);
      await query.run("DROP TABLE approval_histories_old;");
      console.log('Migrated: approval_histories table reconstructed.');
    }

    const auditCommentsMaster = await query.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='audit_comments';");
    if (auditCommentsMaster && auditCommentsMaster.sql.includes('users_old')) {
      console.log('Migrating: Reconstructing audit_comments to point to users...');
      await query.run("ALTER TABLE audit_comments RENAME TO audit_comments_old;");
      await query.exec(`
        CREATE TABLE audit_comments (
          comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
          target_type TEXT NOT NULL,
          target_id INTEGER NOT NULL,
          auditor_id INTEGER NOT NULL REFERENCES users(user_id),
          comment TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await query.run(`
        INSERT INTO audit_comments (
          comment_id, target_type, target_id, auditor_id, comment, created_at, updated_at
        )
        SELECT 
          comment_id, target_type, target_id, auditor_id, comment, created_at, COALESCE(updated_at, created_at)
        FROM audit_comments_old;
      `);
      await query.run("DROP TABLE audit_comments_old;");
      console.log('Migrated: audit_comments table reconstructed.');
    }

    const systemLogsMaster = await query.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='system_logs';");
    if (systemLogsMaster && systemLogsMaster.sql.includes('users_old')) {
      console.log('Migrating: Reconstructing system_logs to point to users...');
      await query.run("ALTER TABLE system_logs RENAME TO system_logs_old;");
      await query.exec(`
        CREATE TABLE system_logs (
          log_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          details TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_position TEXT,
          user_agent TEXT,
          target_id INTEGER,
          result TEXT DEFAULT 'SUCCESS'
        );
      `);
      const hasPos = systemLogsMaster.sql.toLowerCase().includes('user_position');
      const hasAgent = systemLogsMaster.sql.toLowerCase().includes('user_agent');
      const hasTarget = systemLogsMaster.sql.toLowerCase().includes('target_id');
      const hasResult = systemLogsMaster.sql.toLowerCase().includes('result');
      await query.run(`
        INSERT INTO system_logs (
          log_id, user_id, action, details, ip_address, created_at, user_position, user_agent, target_id, result
        )
        SELECT 
          log_id, user_id, action, details, ip_address, created_at,
          ${hasPos ? 'user_position' : 'NULL'},
          ${hasAgent ? 'user_agent' : 'NULL'},
          ${hasTarget ? 'target_id' : 'NULL'},
          ${hasResult ? 'result' : "'SUCCESS'"}
        FROM system_logs_old;
      `);
      await query.run("DROP TABLE system_logs_old;");
      console.log('Migrated: system_logs table reconstructed.');
    }

    const notificationsMaster = await query.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='notifications';");
    if (notificationsMaster && notificationsMaster.sql.includes('users_old')) {
      console.log('Migrating: Reconstructing notifications to point to users...');
      await query.run("ALTER TABLE notifications RENAME TO notifications_old;");
      await query.exec(`
        CREATE TABLE notifications (
          notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          status TEXT DEFAULT 'UNREAD' NOT NULL,
          target_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const hasStatus = notificationsMaster.sql.toLowerCase().includes('status');
      await query.run(`
        INSERT INTO notifications (
          notification_id, user_id, type, message, is_read, status, target_url, created_at
        )
        SELECT 
          notification_id, user_id, type, message, is_read,
          ${hasStatus ? 'status' : "'UNREAD'"},
          target_url, created_at
        FROM notifications_old;
      `);
      await query.run("DROP TABLE notifications_old;");
      console.log('Migrated: notifications table reconstructed.');
    }

    // Restore foreign key verification
    await query.run("PRAGMA foreign_keys = ON;");


    // Standard Alter Table checks
    // Migrate users table
    const usersInfo = await query.all("PRAGMA table_info(users);");
    const usersCols = usersInfo.map(col => col.name);
    if (usersCols.length > 0) {
      if (!usersCols.includes('position')) {
        await query.run("ALTER TABLE users ADD COLUMN position TEXT NOT NULL DEFAULT '기타';");
        console.log('Migrated: users.position added.');
      }
      if (!usersCols.includes('group_id')) {
        await query.run("ALTER TABLE users ADD COLUMN group_id INTEGER REFERENCES groups(group_id) ON DELETE SET NULL;");
        console.log('Migrated: users.group_id added.');
      }
      if (!usersCols.includes('updated_at')) {
        await query.run("ALTER TABLE users ADD COLUMN updated_at DATETIME;");
        await query.run("UPDATE users SET updated_at = CURRENT_TIMESTAMP;");
        console.log('Migrated: users.updated_at added.');
      }
    }

    // Migrate vouchers table
    const vouchersInfo = await query.all("PRAGMA table_info(vouchers);");
    const vouchersCols = vouchersInfo.map(col => col.name);
    if (vouchersCols.length > 0) {
      if (!vouchersCols.includes('group_id')) {
        await query.run("ALTER TABLE vouchers ADD COLUMN group_id INTEGER REFERENCES groups(group_id);");
        console.log('Migrated: vouchers.group_id added.');
      }
      if (!vouchersCols.includes('dept_head_approver_id')) {
        await query.run("ALTER TABLE vouchers ADD COLUMN dept_head_approver_id INTEGER REFERENCES users(user_id);");
        console.log('Migrated: vouchers.dept_head_approver_id added.');
      }
      if (!vouchersCols.includes('finance_approver_id')) {
        await query.run("ALTER TABLE vouchers ADD COLUMN finance_approver_id INTEGER REFERENCES users(user_id);");
        console.log('Migrated: vouchers.finance_approver_id added.');
      }
      if (!vouchersCols.includes('updated_at')) {
        await query.run("ALTER TABLE vouchers ADD COLUMN updated_at DATETIME;");
        await query.run("UPDATE vouchers SET updated_at = CURRENT_TIMESTAMP;");
        console.log('Migrated: vouchers.updated_at added.');
      }
    }

    // Migrate ledgers table
    const ledgersInfo = await query.all("PRAGMA table_info(ledgers);");
    const ledgersCols = ledgersInfo.map(col => col.name);
    if (ledgersCols.length > 0) {
      if (!ledgersCols.includes('group_id')) {
        await query.run("ALTER TABLE ledgers ADD COLUMN group_id INTEGER REFERENCES groups(group_id);");
        console.log('Migrated: ledgers.group_id added.');
      }
      if (!ledgersCols.includes('updated_at')) {
        await query.run("ALTER TABLE ledgers ADD COLUMN updated_at DATETIME;");
        await query.run("UPDATE ledgers SET updated_at = CURRENT_TIMESTAMP;");
        console.log('Migrated: ledgers.updated_at added.');
      }
    }

    // Migrate settlement_reports table
    const reportsInfo = await query.all("PRAGMA table_info(settlement_reports);");
    const reportsCols = reportsInfo.map(col => col.name);
    if (reportsCols.length > 0) {
      if (!reportsCols.includes('group_id')) {
        await query.run("ALTER TABLE settlement_reports ADD COLUMN group_id INTEGER REFERENCES groups(group_id);");
        console.log('Migrated: settlement_reports.group_id added.');
      }
      if (!reportsCols.includes('updated_at')) {
        await query.run("ALTER TABLE settlement_reports ADD COLUMN updated_at DATETIME;");
        await query.run("UPDATE settlement_reports SET updated_at = CURRENT_TIMESTAMP;");
        console.log('Migrated: settlement_reports.updated_at added.');
      }
    }

    // Migrate approvals table
    const approvalsInfo = await query.all("PRAGMA table_info(approvals);");
    const approvalsCols = approvalsInfo.map(col => col.name);
    if (approvalsCols.length > 0) {
      if (!approvalsCols.includes('updated_at')) {
        await query.run("ALTER TABLE approvals ADD COLUMN updated_at DATETIME;");
        await query.run("UPDATE approvals SET updated_at = CURRENT_TIMESTAMP;");
        console.log('Migrated: approvals.updated_at added.');
      }
    }

    // Migrate approval_histories table
    const historiesInfo = await query.all("PRAGMA table_info(approval_histories);");
    const historiesCols = historiesInfo.map(col => col.name);
    if (historiesCols.length > 0) {
      if (!historiesCols.includes('signature')) {
        await query.run("ALTER TABLE approval_histories ADD COLUMN signature TEXT;");
        console.log('Migrated: approval_histories.signature added.');
      }
    }

    // Migrate users table
    const userSigCheck = await query.all("PRAGMA table_info(users);");
    const userSigCols = userSigCheck.map(col => col.name);
    if (userSigCols.length > 0) {
      if (!userSigCols.includes('signature')) {
        await query.run("ALTER TABLE users ADD COLUMN signature TEXT;");
        console.log('Migrated: users.signature added.');
      }
    }

    // Migrate notifications table (status column)
    const notiInfo = await query.all("PRAGMA table_info(notifications);");
    const notiCols = notiInfo.map(col => col.name);
    if (notiCols.length > 0) {
      if (!notiCols.includes('status')) {
        await query.run("ALTER TABLE notifications ADD COLUMN status TEXT DEFAULT 'UNREAD';");
        console.log('Migrated: notifications.status added.');
        await query.run("UPDATE notifications SET status = 'READ' WHERE is_read = 1;");
        await query.run("UPDATE notifications SET status = 'UNREAD' WHERE is_read = 0;");
      }
    }

    // Migrate system_logs table (audit columns)
    const logsInfo = await query.all("PRAGMA table_info(system_logs);");
    const logsCols = logsInfo.map(col => col.name);
    if (logsCols.length > 0) {
      if (!logsCols.includes('user_position')) {
        await query.run("ALTER TABLE system_logs ADD COLUMN user_position TEXT;");
        console.log('Migrated: system_logs.user_position added.');
      }
      if (!logsCols.includes('user_agent')) {
        await query.run("ALTER TABLE system_logs ADD COLUMN user_agent TEXT;");
        console.log('Migrated: system_logs.user_agent added.');
      }
      if (!logsCols.includes('target_id')) {
        await query.run("ALTER TABLE system_logs ADD COLUMN target_id INTEGER;");
        console.log('Migrated: system_logs.target_id added.');
      }
      if (!logsCols.includes('result')) {
        await query.run("ALTER TABLE system_logs ADD COLUMN result TEXT DEFAULT 'SUCCESS';");
        console.log('Migrated: system_logs.result added.');
      }
    }

    // Migrate voucher_attachments table (OCR Queue and tags columns)
    const attsInfo = await query.all("PRAGMA table_info(voucher_attachments);");
    const attsCols = attsInfo.map(col => col.name);
    if (attsCols.length > 0) {
      if (!attsCols.includes('ocr_status')) {
        await query.run("ALTER TABLE voucher_attachments ADD COLUMN ocr_status TEXT NOT NULL DEFAULT 'PENDING';");
        // Mark existing records as completed so they are not re-processed
        await query.run("UPDATE voucher_attachments SET ocr_status = 'COMPLETED' WHERE ocr_raw_result IS NOT NULL;");
        console.log('Migrated: voucher_attachments.ocr_status added.');
      }
      if (!attsCols.includes('ocr_result')) {
        await query.run("ALTER TABLE voucher_attachments ADD COLUMN ocr_result TEXT;");
        console.log('Migrated: voucher_attachments.ocr_result added.');
      }
      if (!attsCols.includes('tags')) {
        await query.run("ALTER TABLE voucher_attachments ADD COLUMN tags TEXT;");
        console.log('Migrated: voucher_attachments.tags added.');
      }
      if (!attsCols.includes('ocr_error')) {
        await query.run("ALTER TABLE voucher_attachments ADD COLUMN ocr_error TEXT;");
        console.log('Migrated: voucher_attachments.ocr_error added.');
      }
      if (!attsCols.includes('sort_order')) {
        await query.run("ALTER TABLE voucher_attachments ADD COLUMN sort_order INTEGER DEFAULT 0;");
        console.log('Migrated: voucher_attachments.sort_order added.');
      }
    }

    // Migrate roles in users
    const usersExist = await query.get("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='users';");
    if (usersExist && usersExist.count > 0) {
      await query.run("UPDATE users SET role = 'SYSTEM_ADMIN' WHERE role = 'ADMIN';");
      await query.run("UPDATE users SET role = 'FINANCE_MANAGER' WHERE role = 'FINANCE_TEAM';");
      await query.run("UPDATE users SET role = 'DEPARTMENT_HEAD' WHERE role = 'DEPT_HEAD';");
      await query.run("UPDATE users SET role = 'DEPARTMENT_ACCOUNTANT' WHERE role = 'ACCOUNTANT';");
      console.log('Migrated: User roles updated to new system schema.');
    }

    // Create group_positions table if not exists
    await query.exec(`
      CREATE TABLE IF NOT EXISTS group_positions (
        position_id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'DEPARTMENT_ACCOUNTANT',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, name)
      );
    `);

    // Seed default positions for any group that has no positions
    const groupsList = await query.all('SELECT group_id FROM groups');
    const DEFAULT_POSITIONS = [
      { name: '회계', role: 'DEPARTMENT_ACCOUNTANT' },
      { name: '부장', role: 'DEPARTMENT_HEAD' },
      { name: '위원장', role: 'FINANCE_MANAGER' },
      { name: '총무', role: 'DEPARTMENT_ACCOUNTANT' },
      { name: '교역자', role: 'AUDITOR' },
      { name: '기타', role: 'DEPARTMENT_ACCOUNTANT' }
    ];
    for (const g of groupsList) {
      const existing = await query.get('SELECT position_id FROM group_positions WHERE group_id = ? LIMIT 1', [g.group_id]);
      if (!existing) {
        console.log(`Seeding default positions for group_id: ${g.group_id}`);
        for (const pos of DEFAULT_POSITIONS) {
          await query.run('INSERT OR IGNORE INTO group_positions (group_id, name, role) VALUES (?, ?, ?)', [g.group_id, pos.name, pos.role]);
        }
      }
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

async function initDb() {
  await query.run('PRAGMA foreign_keys = ON;');
  await migrateDb();

  // 1. 위원회/기관 테이블
  await query.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      organization_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. 소속 그룹 테이블 (위원회 산하)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      group_id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(organization_id),
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(organization_id, name)
    );
  `);

  // 3. 사용자 테이블 (직책 position 추가 및 소속 그룹 group_id 매핑)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL, -- 'SYSTEM_ADMIN', 'FINANCE_MANAGER', 'DEPARTMENT_HEAD', 'DEPARTMENT_ACCOUNTANT', 'AUDITOR', 'GENERAL_USER'
      position TEXT NOT NULL, -- '회계', '부장', '위원장', '총무', '교역자', '기타'
      group_id INTEGER REFERENCES groups(group_id) ON DELETE SET NULL,
      signature TEXT,
      is_active INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. 계정과목 테이블 (가변적 관리 지원)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS account_categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'INCOME', 'EXPENSE'
      parent_category TEXT NOT NULL, -- 대분류
      child_category TEXT NOT NULL, -- 중분류
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. 전표 테이블 (소속그룹 group_id 연결 및 지정 결재자 컬럼 탑재)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS vouchers (
      voucher_id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(group_id),
      writer_id INTEGER NOT NULL REFERENCES users(user_id),
      dept_head_approver_id INTEGER REFERENCES users(user_id), -- 지정 부서장(1차 결재자)
      finance_approver_id INTEGER REFERENCES users(user_id),    -- 지정 회계팀장(최종 결재자)
      transaction_date TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES account_categories(category_id),
      summary TEXT NOT NULL,
      vendor TEXT,
      amount REAL NOT NULL,
      payment_method TEXT,
      status TEXT DEFAULT 'TEMP' NOT NULL, -- 'TEMP', 'SUBMITTED', 'DEPT_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED'
      reject_reason TEXT,
      memo TEXT,
      has_attachment INTEGER DEFAULT 0,
      approved_at TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. 전표 첨부파일 테이블 (OCR Queue, tags, sort_order 컬럼 추가)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS voucher_attachments (
      attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
      storage_provider TEXT DEFAULT 'LOCAL' NOT NULL,
      file_name TEXT NOT NULL,
      file_key TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT,
      ocr_raw_result TEXT,
      ocr_confidence REAL,
      ocr_status TEXT NOT NULL DEFAULT 'PENDING',
      ocr_result TEXT,
      tags TEXT,
      ocr_error TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. 장부 테이블 (그룹별 월말 수지 마감)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS ledgers (
      ledger_id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(group_id),
      year_month TEXT NOT NULL,
      carry_over REAL DEFAULT 0.00 NOT NULL,
      total_income REAL DEFAULT 0.00 NOT NULL,
      total_expense REAL DEFAULT 0.00 NOT NULL,
      balance REAL DEFAULT 0.00 NOT NULL,
      status TEXT DEFAULT 'TEMP' NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (group_id, year_month)
    );
  `);

  // 8. 결산보고서 테이블 (그룹별 반기 집계)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS settlement_reports (
      report_id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES groups(group_id),
      fiscal_year INTEGER NOT NULL,
      half_cycle TEXT NOT NULL, -- 'FIRST', 'SECOND'
      budget_amount REAL DEFAULT 0.00 NOT NULL,
      total_income REAL DEFAULT 0.00 NOT NULL,
      total_expense REAL DEFAULT 0.00 NOT NULL,
      balance REAL DEFAULT 0.00 NOT NULL,
      status TEXT DEFAULT 'TEMP' NOT NULL,
      note TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (group_id, fiscal_year, half_cycle)
    );
  `);

  // 9. 전자결재 테이블
  await query.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL, -- 'VOUCHER', 'LEDGER', 'SETTLEMENT'
      target_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      current_step INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. 결재 이력 테이블 (서명 signature 컬럼 탑재)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS approval_histories (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      approval_id INTEGER NOT NULL REFERENCES approvals(approval_id) ON DELETE CASCADE,
      actor_id INTEGER NOT NULL REFERENCES users(user_id),
      action TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      comment TEXT,
      signature TEXT, -- 예: "김회계 (인)"
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. 감사 의견 테이블
  await query.exec(`
    CREATE TABLE IF NOT EXISTS audit_comments (
      comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      auditor_id INTEGER NOT NULL REFERENCES users(user_id),
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. 시스템 로그 테이블
  await query.exec(`
    CREATE TABLE IF NOT EXISTS system_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 13. 실시간 알림 테이블
  await query.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      status TEXT DEFAULT 'UNREAD' NOT NULL, -- 'UNREAD', 'READ', 'CANCELLED', 'ARCHIVED'
      target_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 14. 결산 마감 테이블
  await query.exec(`
    CREATE TABLE IF NOT EXISTS period_locks (
      lock_id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_type TEXT NOT NULL, -- 'MONTH', 'HALF', 'YEAR'
      period_value TEXT NOT NULL, -- '2026-06', '2026-1', '2026'
      is_locked INTEGER DEFAULT 1,
      locked_by INTEGER NOT NULL REFERENCES users(user_id),
      locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(period_type, period_value)
    );
  `);

  console.log('All upgraded tables verified successfully.');
  await seedData();
}

async function seedData() {
  // 1. 위원회/기관 시드 적재
  const orgs = [
    { name: '행정위원회', desc: '교회 재무 행정 및 총무 부서 통괄' },
    { name: '찬양위원회', desc: '각 찬양팀 및 찬양대 성가대 부서' },
    { name: '교육위원회', desc: '대학부, 청년부 및 교육 주일학교 부서' },
    { name: '선교위원회', desc: '국내외 선교 및 구제 특별 위원회' }
  ];

  for (const org of orgs) {
    await query.run(`
      INSERT OR IGNORE INTO organizations (name, description) VALUES (?, ?)
    `, [org.name, org.desc]);
  }

  // 2. 소속 그룹 시드 적재 (위원회 산하 그룹 매핑)
  const grps = [
    { orgName: '행정위원회', name: '행정지원팀', desc: '교회 사무 총무 행정 지원' },
    { orgName: '찬양위원회', name: '예뜰찬양팀', desc: '주일 오전 예배 찬양 봉사' },
    { orgName: '찬양위원회', name: '예루살렘찬양대', desc: '주일 대예배 성가대' },
    { orgName: '교육위원회', name: '대학청년부', desc: '대학 및 청년 전도 봉사 교육' },
    { orgName: '교육위원회', name: '유소년부', desc: '초등 주일학교 어린이 성경 교육' },
    { orgName: '선교위원회', name: '선교기획팀', desc: '해외선교사 연동 및 구제사업' }
  ];

  for (const g of grps) {
    const org = await query.get('SELECT organization_id FROM organizations WHERE name = ?', [g.orgName]);
    if (org) {
      await query.run(`
        INSERT OR IGNORE INTO groups (organization_id, name, description) VALUES (?, ?, ?)
      `, [org.organization_id, g.name, g.desc]);
    }
  }

  // 3. 계정과목 시드 적재
  const categories = [
    { type: 'INCOME', parent: '헌금', child: '십일조헌금', desc: '십일조 헌금 수입' },
    { type: 'INCOME', parent: '헌금', child: '주일감사헌금', desc: '주일 감사헌금' },
    { type: 'INCOME', parent: '지원금', child: '교회보조금', desc: '교회 본회 보조금' },
    { type: 'EXPENSE', parent: '예배비', child: '소모품비', desc: '주보 및 성찬 소모품' },
    { type: 'EXPENSE', parent: '교육비', child: '교재비', desc: '성경 공부용 교재비' },
    { type: 'EXPENSE', parent: '운영비', child: '식비및간식비', desc: '다과 식대 회의 비용' },
    { type: 'EXPENSE', parent: '선교비', child: '후원금', desc: '선교 파견 후원비' }
  ];

  for (const cat of categories) {
    await query.run(`
      INSERT OR IGNORE INTO account_categories (type, parent_category, child_category, description)
      VALUES (?, ?, ?, ?)
    `, [cat.type, cat.parent, cat.child, cat.desc]);
  }

  // 4. 사용자 데이터 적재 (직책 position 및 소속 그룹 group_id 매핑)
  const users = [
    { username: 'admin', name: '관리자', pass: 'admin123', role: 'SYSTEM_ADMIN', position: '기타', groupName: '행정지원팀' },
    { username: 'accountant', name: '김회계 담당자', pass: 'acc123', role: 'DEPARTMENT_ACCOUNTANT', position: '회계', groupName: '예뜰찬양팀' },
    { username: 'depthead', name: '박부장 부서장', pass: 'head123', role: 'DEPARTMENT_HEAD', position: '부장', groupName: '예뜰찬양팀' },
    { username: 'finance', name: '이재정 위원장', pass: 'fin123', role: 'FINANCE_MANAGER', position: '위원장', groupName: '행정지원팀' },
    { username: 'auditor', name: '최감사 교역자', pass: 'aud123', role: 'AUDITOR', position: '교역자', groupName: '행정지원팀' }
  ];

  for (const user of users) {
    const group = await query.get('SELECT group_id FROM groups WHERE name = ?', [user.groupName]);
    const groupId = group ? group.group_id : null;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.pass, salt);

    await query.run(`
      INSERT OR IGNORE INTO users (username, password_hash, name, role, position, group_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [user.username, hash, user.name, user.role, user.position, groupId]);
  }

  console.log('Advanced seed data check completed.');
}

module.exports = {
  query,
  initDb,
  db
};
