// src/services/useAuth.js
import { ref } from 'vue'
import { supabase } from '../supabase'

export const useAuth = () => {
  const user = ref(null)
  const error = ref(null)
  const loading = ref(false)

  const login = async (emailOrUsername, password) => {
    loading.value = true
    error.value = null
    
    try {
      // Проверяем, email это или username
      const isEmail = emailOrUsername.includes('@')
      
      let authResponse
      if (isEmail) {
        authResponse = await supabase.auth.signInWithPassword({
          email: emailOrUsername,
          password
        })
      } else {
        // Ищем пользователя по username
        const { data: userData } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailOrUsername)
          .single()
          
        if (!userData) throw new Error('User not found')
        
        authResponse = await supabase.auth.signInWithPassword({
          email: userData.email,
          password
        })
      }
      
      if (authResponse.error) throw authResponse.error
      user.value = authResponse.data.user
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const register = async (email, password, username) => {
    loading.value = true
    error.value = null
    
    try {
      // Регистрация в Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (authError) throw authError
      
      // Создание профиля пользователя
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          username,
          role: 'user' // По умолчанию обычный пользователь
        })
      
      if (profileError) throw profileError
      
      user.value = authData.user
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (email) => {
    loading.value = true
    error.value = null
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
      if (resetError) throw resetError
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
  }

  const checkAuth = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    user.value = currentUser
    return currentUser
  }

  return {
    user,
    error,
    loading,
    login,
    register,
    resetPassword,
    logout,
    checkAuth
  }
}