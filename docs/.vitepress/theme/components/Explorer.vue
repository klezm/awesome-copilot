<template>
  <div>
    <input v-model="searchTerm" placeholder="Search..." />
    <div class="grid">
      <div v-for="item in filteredItems" :key="item.path" class="card">
        <h3>
          <a :href="`/${item.path}`">{{ item.title }}</a>
        </h3>
        <p>{{ item.description }}</p>
        <a :href="`https://github.com/github/awesome-copilot/blob/main/${item.path}`" target="_blank" rel="noopener noreferrer">View on GitHub</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
})

const searchTerm = ref('')
const items = ref([])

onMounted(async () => {
  const response = await fetch(`/data/${props.type}.json`)
  items.value = await response.json()
})

const filteredItems = computed(() => {
  if (!searchTerm.value) {
    return items.value
  }
  return items.value.filter(item =>
    item.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.value.toLowerCase()))
  )
})
</script>

<style scoped>
input {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.card {
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 4px;
}

h3 {
  margin-top: 0;
}
</style>
