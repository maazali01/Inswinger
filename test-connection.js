import { supabase } from './lib/supabase.js';

// Test Supabase Connection
async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Check connection
    console.log('1. Testing basic connection...');
    const { error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful!\n');

    // Test 2: Check auth session
    console.log('2. Checking auth session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ User is logged in:', session.user.email);
      console.log('   User ID:', session.user.id);
    } else {
      console.log('ℹ️  No active session (not logged in)\n');
    }

    // Test 3: Check user profile
    if (session) {
      console.log('\n3. Checking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile error:', profileError.message);
      } else {
        console.log('✅ Profile found:');
        console.log('   Name:', profile.name);
        console.log('   Role:', profile.role);
        console.log('   Verified:', profile.is_verified);
      }
    }

    // Test 4: Count tables
    console.log('\n4. Checking database tables...');
    const tables = ['users', 'stream_types', 'streams', 'blogs', 'upcoming_events'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count} records`);
      }
    }

    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run tests
testConnection();
