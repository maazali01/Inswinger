-- Function to delete a user completely (both auth.users and public.users)
-- Only admins can call this function
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_role TEXT;
BEGIN
  -- Check if the calling user is an admin
  SELECT role INTO calling_user_role
  FROM public.users
  WHERE id = auth.uid();

  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent admins from deleting themselves
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Delete from public.users first (due to foreign key constraints)
  DELETE FROM public.users WHERE id = user_id;

  -- Delete from auth.users (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'User deleted successfully'
  );
END;
$$;

-- Grant execute permission to authenticated users
-- (the function itself checks if the user is an admin)
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;
