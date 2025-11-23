/**
 * Schema Verification Utility
 * Queries live Supabase database to verify actual schema matches expected
 */

import { supabase } from '../lib/supabase';

interface SchemaColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface SchemaVerificationResult {
  tableName: string;
  exists: boolean;
  columns: SchemaColumn[];
  matches: boolean;
  discrepancies: string[];
  sampleData?: Record<string, unknown>;
}

/**
 * Verify poll_votes table schema against expected structure
 * Queries live Supabase database directly
 */
export async function verifyPollVotesSchema(): Promise<SchemaVerificationResult> {
  const tableName = 'poll_votes';
  const expectedColumns = {
    'id': 'string',
    'poll_id': 'string',
    'user_id': 'string',
    'option_index': 'number',
    'created_at': 'string'
  };

  const result: SchemaVerificationResult = {
    tableName,
    exists: false,
    columns: [],
    matches: true,
    discrepancies: []
  };

  try {
    if (import.meta.env.DEV) {
      console.debug(`[Schema Verify] Querying live Supabase for ${tableName} table...`);
    }
    
    // First, check if table exists by attempting a query
    const { error: tableCheckError } = await supabase
      .from('poll_votes')
      .select('*')
      .limit(0);
    
    if (tableCheckError) {
      if (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist')) {
        result.discrepancies.push(`Table ${tableName} does not exist in database`);
        result.matches = false;
        return result;
      }
      throw tableCheckError;
    }

    result.exists = true;
    if (import.meta.env.DEV) {
      console.debug(`[Schema Verify] Table ${tableName} exists`);
    }

    // Try to get one record to infer schema from live data
    const { data: sampleData, error: sampleError } = await supabase
      .from('poll_votes')
      .select('*')
      .limit(1);
    
    if (sampleError && sampleError.code !== 'PGRST116') {
      // PGRST116 = "No rows found" which is fine for schema verification
      if (import.meta.env.DEV) {
        console.debug(`[Schema Verify] Could not fetch sample data from ${tableName}:`, sampleError.message);
      }
    }

    if (sampleData && sampleData.length > 0) {
      // If we got sample data, verify structure
      const sample = sampleData[0] as Record<string, unknown>;
      result.sampleData = sample;
      
      if (import.meta.env.DEV) {
        console.debug('[Schema Verify] poll_votes sample record found:', Object.keys(sample));
      }
      
      // Verify expected columns exist
      for (const [colName, expectedType] of Object.entries(expectedColumns)) {
        if (!(colName in sample)) {
          result.discrepancies.push(`Missing column: ${colName}`);
          result.matches = false;
        } else {
          const actualValue = sample[colName];
          const actualType = typeof actualValue;
          
          // Check type alignment
          if (expectedType === 'number' && actualType !== 'number') {
            result.discrepancies.push(
              `Column ${colName}: Expected number, but value type is ${actualType} (value: ${JSON.stringify(actualValue)})`
            );
            result.matches = false;
          } else if (expectedType === 'string' && actualType !== 'string') {
            // created_at might be Date object, which is fine
            if (colName !== 'created_at' || actualType !== 'object') {
              result.discrepancies.push(
                `Column ${colName}: Expected string, but value type is ${actualType}`
              );
              result.matches = false;
            }
          }
          
          // Log column info for verification
          if (import.meta.env.DEV) {
            console.debug(`[Schema Verify] poll_votes.${colName}:`, {
              exists: true,
              type: actualType,
              value: actualValue,
              expectedType
            });
          }
        }
      }
      
      // Check for unexpected columns
      const expectedColNames = Object.keys(expectedColumns);
      const actualColNames = Object.keys(sample);
      const unexpectedCols = actualColNames.filter(col => !expectedColNames.includes(col));
      if (unexpectedCols.length > 0 && import.meta.env.DEV) {
        console.debug('[Schema Verify] poll_votes has unexpected columns:', unexpectedCols);
      }
    } else {
      // No data but table exists - table structure valid but empty
      if (import.meta.env.DEV) {
        console.debug(`[Schema Verify] Table ${tableName} exists but has no data - cannot verify column types`);
      }
      result.exists = true;
      result.discrepancies.push('Table exists but has no data - column type verification skipped');
    }

    // Add column names found
    if (sampleData && sampleData.length > 0) {
      const sample = sampleData[0] as Record<string, unknown>;
      result.columns = Object.keys(sample).map(key => ({
        column_name: key,
        data_type: typeof sample[key],
        is_nullable: 'YES',
        column_default: null
      }));
    }

    return result;

  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[Schema Verify] Fatal error verifying ${tableName}:`, error);
    }
    result.discrepancies.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    result.matches = false;
    return result;
  }
}

/**
 * Verify polls table schema
 */
export async function verifyPollsSchema(): Promise<SchemaVerificationResult> {
  const tableName = 'polls';
  const expectedColumns = {
    'id': 'string',
    'room_id': 'string',
    'title': 'string',
    'description': 'string | undefined',
    'options': 'array',
    'created_by': 'string',
    'expires_at': 'string | undefined',
    'is_active': 'boolean',
    'created_at': 'string'
  };

  const result: SchemaVerificationResult = {
    tableName,
    exists: false,
    columns: [],
    matches: true,
    discrepancies: []
  };

  try {
    // Check table exists by attempting a query
    const { data: sampleData, error } = await supabase
      .from('polls')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        result.discrepancies.push(`Table ${tableName} does not exist`);
        return result;
      }
      throw error;
    }

    result.exists = true;

    // Verify structure with sample data
    if (sampleData && sampleData.length > 0) {
      const sample = sampleData[0] as Record<string, unknown>;
      
      for (const [colName, expectedType] of Object.entries(expectedColumns)) {
        if (!(colName in sample) && !expectedType.includes('undefined')) {
          result.discrepancies.push(`Missing required column: ${colName}`);
          result.matches = false;
        } else if (colName in sample) {
          const actualValue = sample[colName];
          const actualType = typeof actualValue;
          
          // Special handling for arrays
          if (expectedType === 'array' && !Array.isArray(actualValue)) {
            result.discrepancies.push(
              `Column ${colName}: Expected array, but got ${actualType}`
            );
            result.matches = false;
          } else if (expectedType === 'boolean' && actualType !== 'boolean') {
            result.discrepancies.push(
              `Column ${colName}: Expected boolean, but got ${actualType}`
            );
            result.matches = false;
          }
        }
      }

      // Add column info
      result.columns = Object.keys(sample).map(key => ({
        column_name: key,
        data_type: Array.isArray(sample[key]) ? 'array' : typeof sample[key],
        is_nullable: sample[key] === undefined || sample[key] === null ? 'YES' : 'NO',
        column_default: null
      }));
    } else {
      result.exists = true;
      if (import.meta.env.DEV) {
        console.debug(`[Schema Verify] Table ${tableName} exists but has no data`);
      }
    }

    return result;

  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[Schema Verify] Error verifying ${tableName}:`, error);
    }
    result.discrepancies.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    result.matches = false;
    return result;
  }
}

/**
 * Verify chatmessages table schema against expected structure
 * Enterprise standard: Queries live Supabase database directly
 */
export async function verifyChatMessagesSchema(): Promise<SchemaVerificationResult> {
  const tableName = 'chatmessages';
  const expectedColumns = {
    'id': 'string',
    'room_id': 'string',
    'user_id': 'string',
    'user_role': 'string',
    'content': 'string',
    'content_type': 'string',
    'file_url': 'string | undefined',
    'is_deleted': 'boolean',
    'is_off_topic': 'boolean',
    'deleted_by': 'string | undefined',
    'deleted_at': 'string | undefined',
    'pinned_by': 'string | undefined',
    'pinned_at': 'string | undefined',
    'created_at': 'string'
  };

  return await verifyTableSchema(tableName, expectedColumns);
}

/**
 * Verify alerts table schema against expected structure
 * Enterprise standard: Queries live Supabase database directly
 */
export async function verifyAlertsSchema(): Promise<SchemaVerificationResult> {
  const tableName = 'alerts';
  const expectedColumns = {
    'id': 'string',
    'room_id': 'string',
    'title': 'string | undefined',
    'body': 'string | undefined',
    'author_role': 'string | undefined',
    'author': 'object | undefined',
    'author_id': 'string | undefined',
    'has_legal_disclosure': 'boolean',
    'legal_disclosure_text': 'string | undefined',
    'type': 'string | undefined',
    'is_non_trade': 'boolean | undefined',
    'created_at': 'string'
  };

  return await verifyTableSchema(tableName, expectedColumns);
}

/**
 * Verify rooms table schema against expected structure
 * Enterprise standard: Queries live Supabase database directly
 */
export async function verifyRoomsSchema(): Promise<SchemaVerificationResult> {
  const tableName = 'rooms';
  const expectedColumns = {
    'id': 'string',
    'tenant_id': 'string',
    'name': 'string',
    'title': 'string',
    'description': 'string | undefined',
    'icon_url': 'string | undefined',
    'icon_bg_color': 'string',
    'icon_color': 'string | undefined',
    'title_color': 'string',
    'description_color': 'string',
    'card_bg_color': 'string',
    'card_border_color': 'string',
    'button_text': 'string',
    'button_bg_color': 'string',
    'button_text_color': 'string',
    'button_width': 'string',
    'is_active': 'boolean',
    'tags': 'array | undefined',
    'created_by': 'string',
    'created_at': 'string',
    'updated_at': 'string'
  };

  return await verifyTableSchema(tableName, expectedColumns);
}

/**
 * Verify users table schema against expected structure
 * Enterprise standard: Queries live Supabase database directly
 */
export async function verifyUsersSchema(): Promise<SchemaVerificationResult> {
  const tableName = 'users';
  const expectedColumns = {
    'id': 'string',
    'email': 'string',
    'display_name': 'string | undefined',
    'avatar_url': 'string | undefined',
    'role': 'string',
    'created_at': 'string',
    'updated_at': 'string'
  };

  return await verifyTableSchema(tableName, expectedColumns);
}

/**
 * Verify user_themes table schema against expected structure
 * Enterprise standard: Queries live Supabase database directly
 */
export async function verifyUserThemesSchema(): Promise<SchemaVerificationResult> {
  const tableName = 'user_themes';
  const expectedColumns = {
    'id': 'string',
    'user_id': 'string',
    'name': 'string',
    'description': 'string | undefined',
    'thumbnail_light': 'string | undefined',
    'thumbnail_dark': 'string | undefined',
    'theme_json': 'object',
    'created_at': 'string',
    'updated_at': 'string'
  };

  return await verifyTableSchema(tableName, expectedColumns);
}

/**
 * Generic table schema verification function
 * Enterprise standard: Reusable verification logic
 */
async function verifyTableSchema(
  tableName: string,
  expectedColumns: Record<string, string>
): Promise<SchemaVerificationResult> {
  const result: SchemaVerificationResult = {
    tableName,
    exists: false,
    columns: [],
    matches: true,
    discrepancies: []
  };

  try {
    if (import.meta.env.DEV) {
      console.debug(`[Schema Verify] Querying live Supabase for ${tableName} table...`);
    }
    
    // Check if table exists by attempting a query
    const { error: tableCheckError } = await supabase
      .from(tableName as never)
      .select('*')
      .limit(0);
    
    if (tableCheckError) {
      if (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist')) {
        result.discrepancies.push(`Table ${tableName} does not exist in database`);
        result.matches = false;
        return result;
      }
      throw tableCheckError;
    }

    result.exists = true;

    // Try to get sample data to infer schema
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName as never)
      .select('*')
      .limit(1);
    
    if (sampleError && sampleError.code !== 'PGRST116') {
      // PGRST116 = "No rows found" which is fine for schema verification
      if (import.meta.env.DEV) {
        console.debug(`[Schema Verify] Could not fetch sample data from ${tableName}:`, sampleError.message);
      }
    }

    if (sampleData && sampleData.length > 0) {
      const sample = sampleData[0] as Record<string, unknown>;
      result.sampleData = sample;
      
      if (import.meta.env.DEV) {
        console.debug(`[Schema Verify] ${tableName} sample record found:`, Object.keys(sample));
      }
      
      // Verify expected columns exist and match types
      for (const [colName, expectedType] of Object.entries(expectedColumns)) {
        const isOptional = expectedType.includes('undefined');
        const baseType = expectedType.replace(' | undefined', '').replace(' | null', '').trim();
        
        if (!(colName in sample)) {
          if (!isOptional) {
            result.discrepancies.push(`Missing required column: ${colName}`);
            result.matches = false;
          }
        } else {
          const actualValue = sample[colName];
          const actualType = typeof actualValue;
          
          // Type checking
          if (baseType === 'string' && actualType !== 'string' && actualValue !== null && actualValue !== undefined) {
            result.discrepancies.push(
              `Column ${colName}: Expected ${baseType}, but value type is ${actualType}`
            );
            result.matches = false;
          } else if (baseType === 'number' && actualType !== 'number' && actualValue !== null && actualValue !== undefined) {
            result.discrepancies.push(
              `Column ${colName}: Expected ${baseType}, but value type is ${actualType}`
            );
            result.matches = false;
          } else if (baseType === 'boolean' && actualType !== 'boolean' && actualValue !== null && actualValue !== undefined) {
            result.discrepancies.push(
              `Column ${colName}: Expected ${baseType}, but value type is ${actualType}`
            );
            result.matches = false;
          } else if (baseType === 'array' && !Array.isArray(actualValue) && actualValue !== null && actualValue !== undefined) {
            result.discrepancies.push(
              `Column ${colName}: Expected ${baseType}, but value type is ${actualType}`
            );
            result.matches = false;
          } else if (baseType === 'object' && actualType !== 'object' && actualValue !== null && actualValue !== undefined && !Array.isArray(actualValue)) {
            result.discrepancies.push(
              `Column ${colName}: Expected ${baseType}, but value type is ${actualType}`
            );
            result.matches = false;
          }
        }
      }
      
      // Build columns list
      result.columns = Object.keys(sample).map(key => ({
        column_name: key,
        data_type: Array.isArray(sample[key]) ? 'array' : typeof sample[key],
        is_nullable: sample[key] === undefined || sample[key] === null ? 'YES' : 'NO',
        column_default: null
      }));
    } else {
      result.exists = true;
      if (import.meta.env.DEV) {
        console.debug(`[Schema Verify] Table ${tableName} exists but has no data - column type verification skipped`);
      }
      result.discrepancies.push('Table exists but has no data - column type verification skipped');
    }

    return result;

  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[Schema Verify] Fatal error verifying ${tableName}:`, error);
    }
    result.discrepancies.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    result.matches = false;
    return result;
  }
}

/**
 * Comprehensive schema verification for all critical tables
 * Enterprise standard: Verifies all tables against live Supabase schema
 */
export async function verifyAllCriticalTables(): Promise<{
  chatmessages: SchemaVerificationResult;
  alerts: SchemaVerificationResult;
  polls: SchemaVerificationResult;
  pollVotes: SchemaVerificationResult;
  rooms: SchemaVerificationResult;
  users: SchemaVerificationResult;
  userThemes: SchemaVerificationResult;
  allMatch: boolean;
  summary: {
    totalTables: number;
    tablesExist: number;
    tablesMatch: number;
    tablesWithIssues: number;
  };
}> {
  if (import.meta.env.DEV) {
    console.debug('[Schema Verify] Starting comprehensive live Supabase schema verification...');
  }
  
  // Verify all tables in parallel for performance
  const [
    chatmessagesResult,
    alertsResult,
    pollsResult,
    pollVotesResult,
    roomsResult,
    usersResult,
    userThemesResult
  ] = await Promise.all([
    verifyChatMessagesSchema(),
    verifyAlertsSchema(),
    verifyPollsSchema(),
    verifyPollVotesSchema(),
    verifyRoomsSchema(),
    verifyUsersSchema(),
    verifyUserThemesSchema()
  ]);

  const allMatch = 
    chatmessagesResult.matches &&
    alertsResult.matches &&
    pollsResult.matches &&
    pollVotesResult.matches &&
    roomsResult.matches &&
    usersResult.matches &&
    userThemesResult.matches;

  const summary = {
    totalTables: 7,
    tablesExist: [
      chatmessagesResult,
      alertsResult,
      pollsResult,
      pollVotesResult,
      roomsResult,
      usersResult,
      userThemesResult
    ].filter(r => r.exists).length,
    tablesMatch: [
      chatmessagesResult,
      alertsResult,
      pollsResult,
      pollVotesResult,
      roomsResult,
      usersResult,
      userThemesResult
    ].filter(r => r.matches).length,
    tablesWithIssues: [
      chatmessagesResult,
      alertsResult,
      pollsResult,
      pollVotesResult,
      roomsResult,
      usersResult,
      userThemesResult
    ].filter(r => r.discrepancies.length > 0).length
  };

  if (import.meta.env.DEV) {
    console.debug('[Schema Verify] Verification complete:', {
      chatmessages: {
        exists: chatmessagesResult.exists,
        matches: chatmessagesResult.matches,
        columns: chatmessagesResult.columns.map(c => c.column_name),
        discrepancies: chatmessagesResult.discrepancies
      },
      alerts: {
        exists: alertsResult.exists,
        matches: alertsResult.matches,
        columns: alertsResult.columns.map(c => c.column_name),
        discrepancies: alertsResult.discrepancies
      },
      polls: {
        exists: pollsResult.exists,
        matches: pollsResult.matches,
        columns: pollsResult.columns.map(c => c.column_name),
        discrepancies: pollsResult.discrepancies
      },
      pollVotes: {
        exists: pollVotesResult.exists,
        matches: pollVotesResult.matches,
        columns: pollVotesResult.columns.map(c => c.column_name),
        discrepancies: pollVotesResult.discrepancies
      },
      rooms: {
        exists: roomsResult.exists,
        matches: roomsResult.matches,
        columns: roomsResult.columns.map(c => c.column_name),
        discrepancies: roomsResult.discrepancies
      },
      users: {
        exists: usersResult.exists,
        matches: usersResult.matches,
        columns: usersResult.columns.map(c => c.column_name),
        discrepancies: usersResult.discrepancies
      },
      userThemes: {
        exists: userThemesResult.exists,
        matches: userThemesResult.matches,
        columns: userThemesResult.columns.map(c => c.column_name),
        discrepancies: userThemesResult.discrepancies
      },
      summary,
      allMatch
    });
  }

  return {
    chatmessages: chatmessagesResult,
    alerts: alertsResult,
    polls: pollsResult,
    pollVotes: pollVotesResult,
    rooms: roomsResult,
    users: usersResult,
    userThemes: userThemesResult,
    allMatch,
    summary
  };
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use verifyAllCriticalTables() for comprehensive verification
 */
export async function verifyPollSchemas(): Promise<{
  pollVotes: SchemaVerificationResult;
  polls: SchemaVerificationResult;
  allMatch: boolean;
}> {
  if (import.meta.env.DEV) {
    console.debug('[Schema Verify] Starting live Supabase schema verification (legacy function)...');
  }
  
  const [pollVotesResult, pollsResult] = await Promise.all([
    verifyPollVotesSchema(),
    verifyPollsSchema()
  ]);

  const allMatch = pollVotesResult.matches && pollsResult.matches;

  if (import.meta.env.DEV) {
    console.debug('[Schema Verify] Verification complete:', {
      pollVotes: {
        exists: pollVotesResult.exists,
        matches: pollVotesResult.matches,
        columns: pollVotesResult.columns.map(c => c.column_name),
        discrepancies: pollVotesResult.discrepancies
      },
      polls: {
        exists: pollsResult.exists,
        matches: pollsResult.matches,
        columns: pollsResult.columns.map(c => c.column_name),
        discrepancies: pollsResult.discrepancies
      },
      allMatch
    });
  }

  return {
    pollVotes: pollVotesResult,
    polls: pollsResult,
    allMatch
  };
}

/**
 * Verify storage bucket exists and is accessible
 * Enterprise standard: Verifies bucket configuration against live Supabase
 */
export interface StorageBucketVerificationResult {
  bucketName: string;
  exists: boolean;
  accessible: boolean;
  public: boolean;
  discrepancies: string[];
}

/**
 * Verify a storage bucket exists and has correct permissions
 */
export async function verifyStorageBucket(bucketName: string): Promise<StorageBucketVerificationResult> {
  const result: StorageBucketVerificationResult = {
    bucketName,
    exists: false,
    accessible: false,
    public: false,
    discrepancies: []
  };

  try {
    if (import.meta.env.DEV) {
      console.debug(`[Schema Verify] Verifying storage bucket: ${bucketName}`);
    }

    // Try to list files in bucket (this checks if bucket exists and is accessible)
    const { error } = await supabase.storage.from(bucketName).list('', {
      limit: 1
    });

    if (error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        result.discrepancies.push(`Bucket ${bucketName} does not exist`);
        return result;
      }
      if (error.message.includes('permission') || error.message.includes('denied')) {
        result.exists = true;
        result.discrepancies.push(`Bucket ${bucketName} exists but is not accessible (permission denied)`);
        return result;
      }
      throw error;
    }

    result.exists = true;
    result.accessible = true;

    // Try to get public URL of a test (this checks if bucket is public)
    // Note: This is a best-effort check since we can't create a test file
    // If bucket listing works, it's at least accessible

    if (import.meta.env.DEV) {
      console.debug(`[Schema Verify] Bucket ${bucketName} exists and is accessible`);
    }

    return result;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[Schema Verify] Error verifying bucket ${bucketName}:`, error);
    }
    result.discrepancies.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

/**
 * Verify all storage buckets used by the application
 * Enterprise standard: Comprehensive bucket verification
 */
export async function verifyAllStorageBuckets(): Promise<{
  chatUploads: StorageBucketVerificationResult;
  alertMedia: StorageBucketVerificationResult;
  files: StorageBucketVerificationResult;
  allExist: boolean;
  allAccessible: boolean;
  summary: {
    totalBuckets: number;
    bucketsExist: number;
    bucketsAccessible: number;
  };
}> {
  if (import.meta.env.DEV) {
    console.debug('[Schema Verify] Starting storage bucket verification...');
  }

  // Verify all buckets in parallel for performance
  const [chatUploadsResult, alertMediaResult, filesResult] = await Promise.all([
    verifyStorageBucket('files'), // chatUploads uses 'files' bucket
    verifyStorageBucket('alert-media'),
    verifyStorageBucket('files') // Same bucket, but verify separately for clarity
  ]);

  // Map chatUploads to files bucket result
  const chatUploadsMapped: StorageBucketVerificationResult = {
    ...chatUploadsResult,
    bucketName: 'chatUploads (files)'
  };

  const allExist = chatUploadsResult.exists && alertMediaResult.exists && filesResult.exists;
  const allAccessible = chatUploadsResult.accessible && alertMediaResult.accessible && filesResult.accessible;

  const summary = {
    totalBuckets: 3,
    bucketsExist: [chatUploadsResult, alertMediaResult, filesResult].filter(r => r.exists).length,
    bucketsAccessible: [chatUploadsResult, alertMediaResult, filesResult].filter(r => r.accessible).length
  };

  if (import.meta.env.DEV) {
    console.debug('[Schema Verify] Storage bucket verification complete:', {
      chatUploads: chatUploadsMapped,
      alertMedia: alertMediaResult,
      files: filesResult,
      summary,
      allExist,
      allAccessible
    });
  }

  return {
    chatUploads: chatUploadsMapped,
    alertMedia: alertMediaResult,
    files: filesResult,
    allExist,
    allAccessible,
    summary
  };
}

