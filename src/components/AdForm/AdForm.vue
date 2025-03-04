<template>
  <div class="ad-form-container">
    <h3 class="title">{{ isEdit ? 'Edit' : 'Create New' }} Ad Configuration</h3>
    <div class="ad-details-modal">
      <!-- Standard fields (hidden when keywords are expanded) -->
      <div v-show="!isKeywordExpanded">
        <div class="input-group">
          <label>Name</label>
          <input type="text" v-model="adData.name" placeholder="Ad configuration name">
        </div>

        <div class="input-group">
          <label>URL Pattern</label>
          <div class="url-input-group">
            <input type="text" v-model="adData.url" placeholder="e.g., https://example.com/*">
            <button class="url-button" @click="useCurrentHost" type="button" title="Use current domain with wildcard">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
          </div>
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
          <label>Container ID</label>
          <div class="container-id-group">
            <input type="text" v-model="adData.divId" placeholder="HTML element ID">
            <button class="pick-button" @click="startPicking" type="button">Pick</button>
          </div>
        </div>
      </div>

      <!-- Collapsible keyword options -->
      <div class="collapsible-section" :class="{ 'expanded': isKeywordExpanded }">
        <div class="collapsible-header" @click="toggleKeywordSection">
          <div class="collapsible-title">
            <span>Keywords Targeting</span>
            <span v-if="hasKeyword" class="active-indicator">(Active)</span>
          </div>
          <div class="collapsible-icon">
            {{ isKeywordExpanded ? '▼' : '►' }}
          </div>
        </div>

        <div v-if="isKeywordExpanded" class="collapsible-content">
          <!-- Back button when in expanded mode -->
          <div class="back-button" @click="toggleKeywordSection">
            ← Back to main form
          </div>

          <div class="input-group">
            <label>Source</label>
            <select v-model="keywordSourceType" @change="onKeywordSourceTypeChange">
              <option value="">None</option>
              <option value="query">URL Query Parameter</option>
              <option value="path">URL Path Position</option>
            </select>
          </div>

          <div v-if="keywordSourceType === 'query'" class="input-group">
            <label>Parameter Name</label>
            <input type="text" v-model="adData.keywordQueryParam" placeholder="e.g., category">

            <div v-if="currentQueryValue" class="current-value">
              <span class="value-label">Current value:</span>
              <span class="value-content" :title="currentQueryValue">{{ trimText(currentQueryValue, 15) }}</span>
            </div>

            <div v-if="availableParams.length > 0" class="selector-dropdown">
              <div v-for="param in availableParams" :key="param.name"
                :class="['selector-option', { 'selected': adData.keywordQueryParam === param.name }]"
                @click="selectQueryParam(param.name)">
                <span class="value-name" :title="param.name">{{ trimText(param.name, 12) }}</span>
                <span class="value-content" :title="param.value">{{ trimText(param.value, 12) }}</span>
              </div>
            </div>
          </div>

          <div v-if="keywordSourceType === 'path'" class="input-group">
            <label>Path Position</label>
            <div class="path-input-group">
              <input type="number" v-model="adData.keywordPathPosition" min="0" placeholder="0">
              <button class="auto-button" @click="detectPathPosition">Auto</button>
            </div>

            <div v-if="pathSegmentsPreview.length > 0" class="selector-dropdown">
              <div v-for="(segment, index) in pathSegmentsPreview" :key="index"
                :class="['selector-option', { 'selected': adData.keywordPathPosition === index }]"
                @click="adData.keywordPathPosition = index">
                <span class="value-name">{{ index }}:</span>
                <span class="value-content" :title="segment || '(empty)'">
                  {{ trimText(segment || '(empty)', 20) }}
                </span>
              </div>
            </div>
          </div>
        </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import type { AdConfig, AdType, Site } from '../../types'

// Extend AdConfig type to include keywordPathPosition
declare module '../../types' {
  interface AdConfig {
    keywordPathPosition?: number | null;
  }
}

interface Props {
  adData: AdConfig
  adTypes: AdType[]
  sites: Site[]
  isEdit?: boolean
}

// URL Parameter interface
interface UrlParam {
  name: string;
  value: string;
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [AdConfig]
  cancel: []
  'start-picking': []
}>()

// Initialize keywordPathPosition if it doesn't exist
if (props.adData.keywordPathPosition === undefined) {
  props.adData.keywordPathPosition = null;
}

// State management
const errors = ref<string[]>([])
const currentHost = ref<string>('')
const keywordSourceType = ref<string>('')
const pathSegmentsPreview = ref<string[]>([])
const isKeywordExpanded = ref<boolean>(false)
const currentQueryValue = ref<string | null>(null)
const availableParams = ref<UrlParam[]>([])

// Computed property to check if any keyword targeting is active
const hasKeyword = computed(() => {
  return !!(props.adData.keywordQueryParam || (props.adData.keywordPathPosition !== null && props.adData.keywordPathPosition !== undefined));
})

// Helper function to trim text with ellipsis
const trimText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Toggle keyword section visibility
const toggleKeywordSection = () => {
  isKeywordExpanded.value = !isKeywordExpanded.value;
}

// Select a query parameter from the dropdown
const selectQueryParam = (paramName: string) => {
  props.adData.keywordQueryParam = paramName;
  updateCurrentQueryValue();
}

// Set initial values based on existing config
onMounted(() => {
  // Determine keyword source type but don't auto-expand
  if (props.adData.keywordQueryParam) {
    keywordSourceType.value = 'query';
  } else if (props.adData.keywordPathPosition !== null && props.adData.keywordPathPosition !== undefined) {
    keywordSourceType.value = 'path';
  } else {
    keywordSourceType.value = '';
  }

  // Try to get the active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      try {
        const url = new URL(tabs[0].url);

        // Set current host
        currentHost.value = url.origin + '/*';

        // Get path segments for preview
        const pathSegments = url.pathname.split('/').filter(segment => segment !== '');
        pathSegmentsPreview.value = pathSegments;

        // Get current query parameter value if defined
        if (props.adData.keywordQueryParam) {
          const queryValue = props.adData.keywordQueryParam ? url.searchParams.get(props.adData.keywordQueryParam) : null;
          currentQueryValue.value = queryValue;
        }

        // Get all query parameters from current URL
        const params: UrlParam[] = [];
        url.searchParams.forEach((value, name) => {
          params.push({ name, value });
        });
        availableParams.value = params;
      } catch (e) {
        console.error('Invalid URL:', e);
      }
    }
  });
});

// Element picker
const startPicking = () => {
  emit('start-picking');
}

// Handle keyword source type change
const onKeywordSourceTypeChange = () => {
  if (keywordSourceType.value === 'query') {
    props.adData.keywordPathPosition = null;
    if (!props.adData.keywordQueryParam) {
      props.adData.keywordQueryParam = '';
    }

    // Update current query value
    updateCurrentQueryValue();
  } else if (keywordSourceType.value === 'path') {
    props.adData.keywordQueryParam = '';
    currentQueryValue.value = null;
    if (props.adData.keywordPathPosition === null || props.adData.keywordPathPosition === undefined) {
      props.adData.keywordPathPosition = 0;
    }
  } else {
    // None selected
    props.adData.keywordQueryParam = '';
    props.adData.keywordPathPosition = null;
    currentQueryValue.value = null;
  }
};

// Update the current query parameter value
const updateCurrentQueryValue = () => {
  if (!props.adData.keywordQueryParam) {
    currentQueryValue.value = null;
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      try {
        const url = new URL(tabs[0].url);
        const queryValue = url.searchParams.get(props.adData.keywordQueryParam);
        currentQueryValue.value = queryValue;
      } catch (e) {
        console.error('Invalid URL:', e);
      }
    }
  });
};

// Watch for keywordQueryParam changes
watch(() => props.adData.keywordQueryParam, (newValue) => {
  if (keywordSourceType.value === 'query') {
    updateCurrentQueryValue();
  }
});

// Auto-detect path position with non-empty segment
const detectPathPosition = () => {
  const nonEmptySegmentIndex = pathSegmentsPreview.value.findIndex(segment => segment.trim() !== '');
  if (nonEmptySegmentIndex >= 0) {
    props.adData.keywordPathPosition = nonEmptySegmentIndex;
  } else if (pathSegmentsPreview.value.length > 0) {
    props.adData.keywordPathPosition = 0;
  }
};

// Use just the current host with a wildcard
const useCurrentHost = () => {
  if (currentHost.value) {
    props.adData.url = currentHost.value;
  }
};

// Form validation
const validateForm = () => {
  errors.value = [];
  const { name, adType, site, url, divId } = props.adData;

  if (!name) errors.value.push('Name is required.');
  if (!adType?.id) errors.value.push('Ad Type is required.');
  if (!site?.id) errors.value.push('Site is required.');
  if (!url) errors.value.push('URL Pattern is required.');
  if (!divId) errors.value.push('Container ID is required.');

  return errors.value.length === 0;
};

// Form submission
const onSave = () => {
  if (validateForm()) {
    emit('save', props.adData);
  }
};

// Cancel form
const onCancel = () => emit('cancel');
</script>

<style scoped>
.title {
  font-size: 12px;
  margin-bottom: 4px;
  color: white;
}

.input-group {
  margin-bottom: 6px;
}

.input-group label {
  font-size: 11px;
  color: #aaa;
  display: block;
  margin-bottom: 3px;
}

.container-id-group,
.url-input-group,
.path-input-group {
  display: flex;
  gap: 2px;
}

.url-input-group input,
.path-input-group input {
  flex-grow: 1;
}

.pick-button,
.url-button,
.auto-button {
  height: 22px;
  padding: 0 6px;
  font-size: 10px;
  background: #3182ce;
  white-space: nowrap;
  width: auto !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auto-button {
  background: #4c51bf;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 3px 6px;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  height: 22px;
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
  font-size: 10px;
}

.actions {
  margin-top: 10px;
  gap: 6px;
}

button {
  height: 22px;
  padding: 0 12px;
  font-size: 11px;
}

.secondary {
  background: transparent;
  border: 1px solid #fd563c;
  color: #fd563c;
}

.error-messages {
  color: red;
  font-size: 11px;
  margin-bottom: 6px;
}

.current-value {
  font-size: 10px;
  margin: 4px 0;
  padding: 3px 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.value-label {
  color: #aaa;
}

.value-name {
  color: #8fafee;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.value-content {
  color: #68d391;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.selector-dropdown {
  margin-top: 4px;
  max-height: 80px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.selector-option {
  font-size: 10px;
  color: #eee;
  padding: 3px 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.selector-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.selector-option.selected {
  background: rgba(66, 153, 225, 0.3);
  border-left: 2px solid #4299e1;
}

/* Collapsible section styles */
.collapsible-section {
  margin: 6px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.collapsible-section.expanded {
  margin-top: 0;
  margin-bottom: 0;
}

.collapsible-header {
  padding: 5px 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collapsible-header:hover {
  background: rgba(255, 255, 255, 0.08);
}

.collapsible-title {
  font-size: 11px;
  font-weight: 500;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

.active-indicator {
  font-size: 9px;
  color: #4299e1;
  font-weight: normal;
}

.collapsible-icon {
  color: #718096;
  font-size: 9px;
}

.collapsible-content {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
}

.back-button {
  color: #8fafee;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
  margin-bottom: 8px;
  display: inline-block;
}

.back-button:hover {
  text-decoration: underline;
}

/* Increase spacing when expanded */
.collapsible-section.expanded .input-group {
  margin-bottom: 12px;
}

.collapsible-section.expanded .input-group label {
  font-size: 12px;
  margin-bottom: 4px;
}

.collapsible-section.expanded .selector-dropdown {
  margin-top: 6px;
}

.collapsible-section.expanded .selector-option {
  padding: 4px 8px;
  font-size: 11px;
}

/* Consistent inputs */
.collapsible-section.expanded input[type="number"] {
  -moz-appearance: textfield;
}

.collapsible-section.expanded input[type="number"]::-webkit-inner-spin-button,
.collapsible-section.expanded input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>