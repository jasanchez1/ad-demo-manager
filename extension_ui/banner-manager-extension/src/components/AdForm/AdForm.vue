<template>
  <div class="ad-form-container">
    <h3 class="title">{{ isEdit ? 'Edit' : 'Create New' }} Ad Configuration</h3>
    <div class="ad-details-modal">
      <div class="input-group" :class="{ required: adData.keywordQueryParam }">
        <label>Name <span v-if="adData.keywordQueryParam" class="required-marker">*</span></label>
        <input type="text" v-model="adData.name">
      </div>

      <div class="input-group" :class="{ required: adData.keywordQueryParam }">
        <label>Ad Type <span v-if="adData.keywordQueryParam" class="required-marker">*</span></label>
        <select v-model="adData.adType.id">
          <option v-for="type in adTypes" :key="type.id" :value="type.id">
            {{ type.name + ' - ' + type.width + 'x' + type.height }}
          </option>
        </select>
      </div>

      <div class="input-group" :class="{ required: adData.keywordQueryParam }">
        <label>Site <span v-if="adData.keywordQueryParam" class="required-marker">*</span></label>
        <select v-model="adData.site.id">
          <option v-for="site in sites" :key="site.id" :value="site.id">
            {{ site.name }}
          </option>
        </select>
      </div>

      <div class="input-group" :class="{ required: adData.keywordQueryParam }">
        <label>URL Pattern <span v-if="adData.keywordQueryParam" class="required-marker">*</span></label>
        <input type="text" v-model="adData.url" placeholder="e.g., https://example.com/*">
      </div>

      <div class="input-group" :class="{ required: adData.keywordQueryParam }">
        <label>Container ID <span v-if="adData.keywordQueryParam" class="required-marker">*</span></label>
        <div class="container-id-group">
          <input type="text" v-model="adData.divId" placeholder="HTML element ID">
          <button class="pick-button" @click="startPicking" type="button">Pick</button>
        </div>
      </div>
      <div class="input-group">
        <label>
          Keyword URL Parameter
          <span class="optional-label">
            (Optional)
          </span>
        </label>
        <input type="text" v-model="adData.keywordQueryParam" placeholder="Optional: URL parameter for keywords">
      </div>
      <div v-if="errors.length" class="error-messages">
        <p v-for="(error, index) in errors" :key="index">{{ error }}</p>
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
import { ref } from 'vue'

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
  'start-picking': []
}>()

const startPicking = () => {
  emit('start-picking')
}

const errors = ref<string[]>([])

const validateForm = () => {
  errors.value = []
  const { name, adType, site, url, divId, keywordQueryParam } = props.adData

  if (keywordQueryParam) {
    if (!name) errors.value.push('Name is required.')
    if (!adType?.id) errors.value.push('Ad Type is required.')
    if (!site?.id) errors.value.push('Site is required.')
    if (!url) errors.value.push('URL Pattern is required.')
    if (!divId) errors.value.push('Container ID is required.')
  }

  return errors.value.length === 0
}

const onSave = () => {
  if (validateForm()) {
    emit('save', props.adData)
  }
}

const onCancel = () => emit('cancel')
</script>

<style scoped>
.title {
  font-size: 12px;
  margin-bottom: 4px;
  color: white;
}

.input-group {
  margin-bottom: 4px;
}

.input-group label {
  font-size: 11px;
  color: #aaa;
}

.container-id-group {
  display: flex;
  gap: 4px;
}

.pick-button {
  height: 24px;
  padding: 0 8px;
  font-size: 11px;
  background: #3182ce;
  white-space: nowrap;
  width: auto !important;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  height: 24px;
  background: white;
  box-sizing: border-box;
}

.input-group select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23666' d='M4 6L0 2h8z'/%3E%3C/svg%3E");
  background-position: right 6px center;
  background-repeat: no-repeat;
  padding-right: 20px;
  appearance: none;
}

.input-group input::placeholder {
  color: #999;
  font-size: 11px;
}

.actions {
  margin-top: 8px;
  gap: 6px;
}

button {
  height: 24px;
  padding: 0 12px;
  font-size: 12px;
}

.secondary {
  background: transparent;
  border: 1px solid #fd563c;
  color: #fd563c;
}

.error-messages {
  color: red;
  font-size: 12px;
  margin-bottom: 8px;
}
</style>