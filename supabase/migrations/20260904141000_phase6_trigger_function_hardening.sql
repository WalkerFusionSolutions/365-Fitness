-- Phase 6 trigger-only function privilege hardening.
-- These functions are invoked by database triggers only and should not be
-- directly executable by API roles.

REVOKE ALL ON FUNCTION public.touch_conversation_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_conversation_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.touch_conversation_updated_at() FROM authenticated;

REVOKE ALL ON FUNCTION public.validate_message_participants() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_message_participants() FROM anon;
REVOKE ALL ON FUNCTION public.validate_message_participants() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_conversation_after_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_conversation_after_message() FROM anon;
REVOKE ALL ON FUNCTION public.update_conversation_after_message() FROM authenticated;
