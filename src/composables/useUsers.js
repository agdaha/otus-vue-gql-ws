// src/composables/useUsers.js
import { ref } from 'vue'
import { supabase } from '../supabase'

export const useUsers = () => {
  const users = ref([])
  const error = ref(null)
  const loading = ref(false)

  const fetchUsers = async () => {
    loading.value = true
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (fetchError) throw fetchError
      
      users.value = data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (userId, updates) => {
    loading.value = true
    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        users.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (userId) => {
    loading.value = true
    try {
      // Удаляем пользователя из auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) throw authError
      
      // Удаляем профиль
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (profileError) throw profileError
      
      users.value = users.value.filter(u => u.id !== userId)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const subscribeToUsers = () => {
    const subscription = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            users.value.push(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            const index = users.value.findIndex(u => u.id === payload.new.id)
            if (index !== -1) {
              users.value[index] = payload.new
            }
          } else if (payload.eventType === 'DELETE') {
            users.value = users.value.filter(u => u.id !== payload.old.id)
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(subscription)
    }
  }

  return {
    users,
    error,
    loading,
    fetchUsers,
    updateUser,
    deleteUser,
    subscribeToUsers
  }
}