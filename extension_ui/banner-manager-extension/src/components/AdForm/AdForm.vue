<template>
    <div>
      <h3 class="title">{{ isEdit ? 'Edit' : 'Create New' }} Ad Configuration</h3>
      <div class="ad-details-modal">
        <div class="input-group">
          <label>Name</label>
          <input type="text" v-model="adData.name">
        </div>
        <div class="input-group">
          <label>Ad Type</label>
          <select v-model="adData.adType.id">
            <option v-for="type in adTypes" :key="type.id" :value="type.id">
              {{ type.name + ' - ' + type.width + 'x' + type.height }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label>Site</label>
          <select v-model="adData.site.id">
            <option v-for="site in sites" :key="site.id" :value="site.id">
              {{ site.name }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label>URL Pattern</label>
          <input 
            type="text" 
            v-model="adData.url"
            placeholder="e.g., https://example.com/*"
          >
        </div>
        <div class="input-group">
          <label>Container ID</label>
          <input 
            type="text" 
            v-model="adData.divId"
            placeholder="HTML element ID"
          >
        </div>
        <div class="input-group">
          <label>Keyword URL Parameter</label>
          <input 
            type="text" 
            v-model="adData.keywordQueryParam"
            placeholder="Optional: URL parameter for keywords"
          >
        </div>
        <div class="actions">
          <button class="secondary" @click="onCancel">Cancel</button>
          <button @click="onSave">Save</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import type { AdConfig, AdType, Site } from '../../types'
  
  interface Props {
    adData: AdConfig
    adTypes: AdType[]
    sites: Site[]
    isEdit?: boolean
  }
  
  const props = defineProps<Props>()
  const emit = defineEmits<{
    save: [AdConfig]
    cancel: []
  }>()
  
  const onSave = () => emit('save', props.adData)
  const onCancel = () => emit('cancel')
  </script>
  
  <style scoped>
  .input-group {
    margin-bottom: 1.5rem;
  }
  
  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #ffffff;
    font-size: 1rem;
  }
  
  .input-group input,
  .input-group select {
    width: 100%;
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid #2c3e50;
    background: white;
    color: #1a1a1a;
    font-size: 1rem;
  }
  
  .input-group input::placeholder {
    color: #a0aec0;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  button {
    flex: 1;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  
  button:hover {
    opacity: 0.9;
  }
  
  button.secondary {
    background: transparent;
    border: 1px solid #e74c3c;
    color: #e74c3c;
  }
  
  button:not(.secondary) {
    background: #e74c3c;
    border: none;
    color: white;
  }
  </style>