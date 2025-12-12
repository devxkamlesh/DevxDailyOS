import { createClient } from '@/lib/supabase/client'

/**
 * Sync profile icon between user_rewards and profiles tables
 * Ensures consistency across the app
 */
export async function syncProfileIcon(userId: string, iconId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Update both tables in parallel
    const [rewardsResult, profilesResult] = await Promise.allSettled([
      supabase
        .from('user_rewards')
        .upsert({ 
          user_id: userId, 
          current_avatar: iconId 
        }, { onConflict: 'user_id' }),
      
      supabase
        .from('profiles')
        .update({ profile_icon: iconId })
        .eq('id', userId)
    ])

    // Check if both succeeded
    const rewardsSuccess = rewardsResult.status === 'fulfilled' && !rewardsResult.value.error
    const profilesSuccess = profilesResult.status === 'fulfilled' && !profilesResult.value.error

    if (!rewardsSuccess) {
      console.error('Failed to update user_rewards:', 
        rewardsResult.status === 'rejected' ? rewardsResult.reason : rewardsResult.value.error)
    }

    if (!profilesSuccess) {
      console.error('Failed to update profiles:', 
        profilesResult.status === 'rejected' ? profilesResult.reason : profilesResult.value.error)
    }

    // Return true only if both succeeded
    return rewardsSuccess && profilesSuccess
  } catch (error) {
    console.error('Error syncing profile icon:', error)
    return false
  }
}

/**
 * Sync theme between user_rewards and localStorage
 */
export async function syncTheme(userId: string, themeId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('user_rewards')
      .upsert({ 
        user_id: userId, 
        current_theme: themeId 
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Failed to sync theme:', error)
      return false
    }

    // Also save to localStorage for instant load
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', themeId)
    }

    return true
  } catch (error) {
    console.error('Error syncing theme:', error)
    return false
  }
}

/**
 * Get user's current profile icon from either table
 * Falls back to 'user' if not found
 */
export async function getUserProfileIcon(userId: string): Promise<string> {
  try {
    const supabase = createClient()
    
    // Try user_rewards first (primary source)
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('current_avatar')
      .eq('user_id', userId)
      .single()

    if (rewards?.current_avatar) {
      return rewards.current_avatar
    }

    // Fallback to profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_icon')
      .eq('id', userId)
      .single()

    return profile?.profile_icon || 'user'
  } catch (error) {
    console.error('Error getting profile icon:', error)
    return 'user'
  }
}
