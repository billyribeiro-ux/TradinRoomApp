#!/usr/bin/env node

/**
 * Automated Database Query Validator - Simplified Version
 * Microsoft Principal Engineer Standards - Zero Tolerance Validation
 * No external dependencies required
 */

const fs = require('fs');
const path = require('path');

// Valid table names from live schema
const VALID_TABLES = [
  'users', 'profiles', 'tenants', 'rooms', 'room_memberships',
  'chatmessages', 'alerts', 'notes', 'sessions', 'user_themes',
  'user_integrations', 'system_configuration', 'tenant_configuration',
  'mediatrack'
];

// Expected columns for each table (from live schema)
const TABLE_SCHEMAS = {
  users: ['id', 'email', 'display_name', 'avatar_url', 'role', 'created_at', 'updated_at'],
  profiles: ['id', 'tenant_id', 'display_name', 'avatar_url', 'role', 'status', 'created_at', 'updated_at'],
  tenants: ['id', 'business_name', 'logo_url', 'primary_color', 'secondary_color', 'accent_color', 'text_color_primary', 'text_color_secondary', 'text_color_muted', 'background_primary', 'background_secondary', 'border_color', 'font_family', 'font_size_base', 'font_size_heading', 'font_weight_normal', 'font_weight_bold', 'icon_style', 'icon_size', 'room_icon', 'created_at', 'updated_at'],
  rooms: ['id', 'tenant_id', 'name', 'title', 'description', 'icon_url', 'icon_bg_color', 'title_color', 'description_color', 'card_bg_color', 'card_border_color', 'button_text', 'button_bg_color', 'button_text_color', 'button_width', 'is_active', 'created_by', 'created_at', 'updated_at'],
  room_memberships: ['id', 'room_id', 'user_id', 'role', 'joined_at'],
  chatmessages: ['id', 'room_id', 'user_id', 'user_role', 'content', 'content_type', 'file_url', 'is_deleted', 'is_off_topic', 'deleted_by', 'deleted_at', 'pinned_by', 'pinned_at', 'created_at'],
  alerts: ['id', 'room_id', 'title', 'body', 'author_role', 'author', 'has_legal_disclosure', 'legal_disclosure_text', 'created_at'],
  notes: ['id', 'room_id', 'user_id', 'folder_name', 'filename', 'file_url', 'file_type', 'created_at', 'updated_at'],
  sessions: ['id', 'user_id', 'room_id', 'started_at', 'ended_at'],
  user_themes: ['id', 'user_id', 'name', 'description', 'thumbnail_light', 'thumbnail_dark', 'theme_json', 'created_at', 'updated_at'],
  user_integrations: ['id', 'user_id', 'integration_type', 'access_token', 'refresh_token', 'token_expires_at', 'is_active', 'metadata', 'connected_at', 'last_refreshed_at', 'created_at', 'updated_at'],
  system_configuration: ['id', 'config_key', 'config_value', 'description', 'created_at', 'updated_at'],
  tenant_configuration: ['id', 'tenant_id', 'config_key', 'config_value', 'created_at', 'updated_at'],
  mediatrack: ['id', 'room_id', 'user_id', 'track_type', 'track_id', 'is_active', 'metadata', 'created_at', 'updated_at']
};

/**
 * Extract table name from Supabase query
 */
function extractTableName(query) {
  const fromMatch = query.match(/\.from\(['"`]([^'"`]+)['"`]\)/);
  return fromMatch ? fromMatch[1] : null;
}

/**
 * Extract columns from Supabase query
 */
function extractColumns(query, operation) {
  const columns = [];
  
  if (operation === 'select') {
    const selectMatch = query.match(/\.select\(['"`]([^'"`]+)['"`]\)/);
    if (selectMatch) {
      const selectClause = selectMatch[1];
      if (selectClause === '*') {
        return []; // Wildcard - cannot validate specific columns
      }
      return selectClause.split(',').map(col => col.trim());
    }
  }
  
  return columns;
}

/**
 * Determine operation type from query
 */
function extractOperation(query) {
  if (query.includes('.select(')) return 'select';
  if (query.includes('.insert(')) return 'insert';
  if (query.includes('.update(')) return 'update';
  if (query.includes('.delete(')) return 'delete';
  return 'unknown';
}

/**
 * Validate a single database query
 */
function validateQuery(query, filePath, lineNumber, functionName) {
  const tableName = extractTableName(query);
  const operation = extractOperation(query);
  const issues = [];
  
  // Check if table exists
  if (!tableName) {
    issues.push('Could not extract table name from query');
    return {
      functionName,
      filePath,
      lineNumber,
      query,
      status: 'FAIL',
      issues,
      operation
    };
  }
  
  if (!VALID_TABLES.includes(tableName)) {
    issues.push(`Table '${tableName}' does not exist in database schema`);
    return {
      functionName,
      filePath,
      lineNumber,
      query,
      status: 'FAIL',
      issues,
      tableName,
      operation
    };
  }
  
  // Get expected columns for this table
  const expectedColumns = TABLE_SCHEMAS[tableName];
  if (!expectedColumns) {
    issues.push(`No schema definition found for table '${tableName}'`);
    return {
      functionName,
      filePath,
      lineNumber,
      query,
      status: 'WARN',
      issues,
      tableName,
      operation
    };
  }
  
  // Extract columns used in query
  const usedColumns = extractColumns(query, operation);
  
  // Validate columns (only for select operations with specific columns)
  if (operation === 'select' && usedColumns.length > 0) {
    for (const col of usedColumns) {
      if (!expectedColumns.includes(col)) {
        issues.push(`Column '${col}' does not exist in table '${tableName}'`);
      }
    }
  }
  
  // Determine status
  let status = 'PASS';
  if (issues.some(issue => issue.includes('does not exist'))) {
    status = 'FAIL';
  } else if (issues.length > 0) {
    status = 'WARN';
  }
  
  return {
    functionName,
    filePath,
    lineNumber,
    query,
    status,
    issues,
    tableName,
    columns: usedColumns,
    operation
  };
}

/**
 * Recursively find all TypeScript/TSX files
 */
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other common directories
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Scan codebase for Supabase queries
 */
function scanCodebase() {
  const results = [];
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found');
    return results;
  }
  
  const files = findTsFiles(srcDir);
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(process.cwd(), filePath);
      
      // Look for Supabase queries
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Check for supabase.from() calls
        if (line.includes('supabase.from(')) {
          // Extract function name (look backwards for function declaration)
          let functionName = 'unknown';
          for (let j = i; j >= 0; j--) {
            const funcMatch = lines[j].match(/(?:function|const|async)\s+(\w+)/);
            if (funcMatch) {
              functionName = funcMatch[1];
              break;
            }
          }
          
          const result = validateQuery(line, relativePath, lineNumber, functionName);
          results.push(result);
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Generate validation report
 */
function generateReport(results) {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  
  console.log('\n🔍 DATABASE VALIDATION RESULTS');
  console.log('=====================================');
  console.log(`📊 Total Queries Validated: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warned: ${warned}`);
  console.log(`📈 Success Rate: ${results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : 0}%`);
  
  // Group by status
  const failures = results.filter(r => r.status === 'FAIL');
  const warnings = results.filter(r => r.status === 'WARN');
  
  if (failures.length > 0) {
    console.log('\n❌ FAILED QUERIES:');
    console.log('==================');
    failures.forEach(f => {
      console.log(`\n📁 ${f.filePath}:${f.lineNumber}`);
      console.log(`🔧 Function: ${f.functionName}`);
      console.log(`📝 Query: ${f.query.trim()}`);
      console.log(`🏷️  Table: ${f.tableName}`);
      console.log(`⚡ Operation: ${f.operation}`);
      console.log(`🚨 Issues:`);
      f.issues.forEach(issue => console.log(`   - ${issue}`));
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNED QUERIES:');
    console.log('==================');
    warnings.forEach(w => {
      console.log(`\n📁 ${w.filePath}:${w.lineNumber}`);
      console.log(`🔧 Function: ${w.functionName}`);
      console.log(`📝 Query: ${w.query.trim()}`);
      console.log(`🏷️  Table: ${w.tableName}`);
      console.log(`⚡ Operation: ${w.operation}`);
      console.log(`⚠️  Issues:`);
      w.issues.forEach(issue => console.log(`   - ${issue}`));
    });
  }
  
  // Summary by table
  const tableStats = new Map();
  results.forEach(r => {
    if (r.tableName) {
      const stats = tableStats.get(r.tableName) || { total: 0, passed: 0, failed: 0, warned: 0 };
      stats.total++;
      if (r.status === 'PASS') stats.passed++;
      else if (r.status === 'FAIL') stats.failed++;
      else if (r.status === 'WARN') stats.warned++;
      tableStats.set(r.tableName, stats);
    }
  });
  
  if (tableStats.size > 0) {
    console.log('\n📊 TABLE STATISTICS:');
    console.log('====================');
    tableStats.forEach((stats, table) => {
      const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`🏷️  ${table}: ${stats.passed}/${stats.total} passed (${successRate}%)`);
    });
  }
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 Starting automated database query validation...\n');
  
  try {
    // Scan codebase
    console.log('🔍 Scanning codebase for database queries...');
    const results = scanCodebase();
    
    if (results.length === 0) {
      console.log('⚠️  No Supabase queries found in codebase');
      process.exit(0);
    }
    
    console.log(`📊 Found ${results.length} database queries to validate\n`);
    
    // Generate report
    generateReport(results);
    
    // Exit with appropriate code
    const failed = results.filter(r => r.status === 'FAIL').length;
    if (failed > 0) {
      console.log(`\n❌ Validation failed with ${failed} critical issues`);
      process.exit(1);
    } else {
      console.log('\n✅ All database queries validated successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run validation
main();
