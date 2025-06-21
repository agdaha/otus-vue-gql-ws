<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { register, error, loading } = useAuth()

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  await register(email.value, password.value, username.value)
  if (!error.value) {
    router.push('/chat/public')
  }
}
</script>

<template>
  <div class="auth-page">
    <h1>Register</h1>
    
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" required />
      </div>
      
      <div class="form-group">
        <label for="username">Username</label>
        <input id="username" v-model="username" type="text" required />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" required />
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" v-model="confirmPassword" type="password" required />
      </div>
      
      <div v-if="error" class="error">{{ error }}</div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Loading...' : 'Register' }}
      </button>
    </form>
    
    <router-link to="/login">Already have an account? Login</router-link>
  </div>
</template>