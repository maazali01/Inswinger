import { supabase } from './supabase';

export const checkDatabaseSetup = async () => {
  const results = {
    isSetup: true,
    errors: [],
    tables: {
      users: false,
      stream_types: false,
      streams: false,
      blogs: false,
      upcoming_events: false,
      chat_messages: false,
    }
  };

  try {
    // Check each table
    const tables = ['users', 'stream_types', 'streams', 'blogs', 'upcoming_events', 'chat_messages'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          if (error.code === '42P01') {
            results.errors.push(`Table '${table}' does not exist`);
            results.isSetup = false;
          } else if (error.code === 'PGRST116') {
            // Table exists but no data (this is OK)
            results.tables[table] = true;
          } else {
            results.errors.push(`Error checking '${table}': ${error.message}`);
            results.isSetup = false;
          }
        } else {
          results.tables[table] = true;
        }
      } catch (err) {
        results.errors.push(`Exception checking '${table}': ${err.message}`);
        results.isSetup = false;
      }
    }
  } catch (error) {
    results.errors.push(`General error: ${error.message}`);
    results.isSetup = false;
  }

  return results;
};

export const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        return {
          connected: true,
          setupComplete: false,
          message: 'Connected to Supabase, but database tables are not set up. Please run the SQL from SUPABASE_SETUP.md'
        };
      }
      return {
        connected: false,
        setupComplete: false,
        message: `Connection error: ${error.message}`
      };
    }
    
    return {
      connected: true,
      setupComplete: true,
      message: 'Successfully connected to Supabase'
    };
  } catch (error) {
    return {
      connected: false,
      setupComplete: false,
      message: `Connection failed: ${error.message}`
    };
  }
};
