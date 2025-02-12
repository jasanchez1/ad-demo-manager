<template>
  <div class="ad-form-container">
    <!-- Picking Mode UI -->
    <div v-if="isPicking" class="picking-header">
      <div class="picking-content">
        <img src="/icon.jpg" alt="Banner Manager Icon" class="header-icon" />
        <span>Click on any element to select it as container</span>
        <button class="cancel-pick" @click="cancelPicking">Cancel</button>
      </div>
    </div>
 
    <!-- Normal Form UI -->
    <div v-else>
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
          <input type="text" v-model="adData.url" placeholder="e.g., https://example.com/*">
        </div>
        <div class="input-group">
          <label>Container ID</label>
          <div class="container-id-group">
            <input type="text" v-model="adData.divId" placeholder="HTML element ID">
            <button class="pick-button" @click="startPicking" type="button">Pick</button>
          </div>
        </div>
        <div class="input-group">
          <label>Keyword URL Parameter</label>
          <input type="text" v-model="adData.keywordQueryParam" placeholder="Optional: URL parameter for keywords">
        </div>
        <div class="actions">
          <button class="secondary" @click="onCancel">Cancel</button>
          <button @click="onSave">Save</button>
        </div>
      </div>
    </div>
  </div>
 </template>
 
 <script setup lang="ts">
 import { ref } from 'vue'
 import type { AdConfig, AdType, Site } from '../../types'
 
 interface Props {
  adData: AdConfig
  adTypes: AdType[]
  sites: Site[]
  isEdit?: boolean
 }
 
 const props = defineProps<Props>()
 const isPicking = ref(false)
 
 const emit = defineEmits<{
  save: [AdConfig]
  cancel: []
  'start-picking': []
  'end-picking': []
}>()

const startPicking = () => {
  emit('start-picking')
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      const elementSelectionHandler = (message: any, sender: any, sendResponse: any) => {
        if (message.type === 'elementSelected') {
          props.adData.divId = message.elementInfo.value;
          chrome.runtime.onMessage.removeListener(elementSelectionHandler);
          chrome.tabs.sendMessage(tabs[0].id!, { action: 'toggleExtension' });
          emit('end-picking');
        }
      };

      chrome.runtime.onMessage.addListener(elementSelectionHandler);
      chrome.runtime.sendMessage({ 
        type: 'startPicking',
        tabId: tabs[0].id 
      });
    }
  });
}

 
 const onSave = () => emit('save', props.adData)
 const onCancel = () => emit('cancel')
 </script>
 
 <style scoped>
 .picking-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #001830;
  padding: 8px;
  z-index: 999999;
  border-bottom: 1px solid #3182ce;
 }
 
 .picking-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 12px;
 }
 
 .header-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
 }
 
 .cancel-pick {
  margin-left: auto;
  height: 24px;
  padding: 0 12px;
  font-size: 12px;
  background: transparent;
  border: 1px solid #fd563c;
  color: #fd563c;
 }
 
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
 </style>