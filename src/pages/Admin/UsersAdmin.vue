<script setup>
import { onMounted, ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useUsers } from '../composables/useUsers'

const { user } = useAuth()
const { users, fetchUsers, updateUser, deleteUser, subscribeToUsers } = useUsers()

const editingUserId = ref(null)
const userUpdates = ref({})

onMounted(async () => {
  await fetchUsers()
  const unsubscribe = subscribeToUsers()
  
  onUnmounted(() => {
    unsubscribe()
  })
})

const startEdit = (user) => {
  editingUserId.value = user.id
  userUpdates.value = { ...user }
}

const cancelEdit = () => {
  editingUserId.value = null
  userUpdates.value = {}
}

const saveEdit = async () => {
  await updateUser(editingUserId.value, userUpdates.value)
  cancelEdit()
}

const handleDelete = async (userId) => {
  if (confirm('Are you sure you want to delete this user?')) {
    await deleteUser(userId)
  }
}
</script>

<template>
  <div class="admin-container">
    <h1>User Management</h1>
    
    <table class="users-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="userItem in users" :key="userItem.id">
          <td>
            <span v-if="editingUserId !== userItem.id">{{ userItem.username }}</span>
            <input v-else v-model="userUpdates.username" type="text" />
          </td>
          <td>{{ userItem.email }}</td>
          <td>
            <span v-if="editingUserId !== userItem.id">{{ userItem.role }}</span>
            <select v-else v-model="userUpdates.role">
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </td>
          <td>
            <button 
              v-if="editingUserId !== userItem.id && user.id !== userItem.id" 
              @click="startEdit(userItem)"
            >
              Edit
            </button>
            <div v-else-if="editingUserId === userItem.id">
              <button @click="saveEdit">Save</button>
              <button @click="cancelEdit">Cancel</button>
            </div>
            <button 
              v-if="user.id !== userItem.id" 
              @click="handleDelete(userItem.id)"
              class="delete-btn"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>