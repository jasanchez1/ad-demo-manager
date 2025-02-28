<template>
    <div class="ad-item-menu">
      <div class="menu-trigger" @click.stop="toggleMenu">
        <span class="dots">⋮</span>
      </div>
      <div class="menu-dropdown" v-if="menuOpen" @click.stop>
        <div class="menu-item" @click.stop="$emit('edit')">
          <svg class="menu-icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" fill="currentColor" />
          </svg>
          <span>Edit</span>
        </div>
        <div class="menu-item" @click.stop="$emit('export')">
          <svg class="menu-icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M14,13V17H10V13H7L12,8L17,13M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z" fill="currentColor" />
          </svg>
          <span>Export</span>
        </div>
        <div class="menu-item delete" @click.stop="$emit('delete')">
          <svg class="menu-icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" fill="currentColor" />
          </svg>
          <span>Delete</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  defineEmits<{
    edit: []
    export: []
    delete: []
  }>()
  
  const menuOpen = ref(false)
  
  const toggleMenu = () => {
    menuOpen.value = !menuOpen.value
  }
  
  // Close menu when clicking outside
  const closeMenu = (e: MouseEvent) => {
    menuOpen.value = false
  }
  
  // Add/remove event listener for document clicks
  document.addEventListener('click', closeMenu)
  </script>
  
  <style scoped>
  .ad-item-menu {
    position: relative;
  }
  
  .menu-trigger {
    cursor: pointer;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dots {
    font-size: 16px;
    color: white;
    line-height: 1;
  }
  
  .menu-dropdown {
    position: absolute;
    right: 0;
    top: 100%;
    background: #001830;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
    z-index: 10;
    min-width: 120px;
    overflow: hidden;
  }
  
  .menu-item {
    padding: 8px 12px;
    color: white;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background 0.2s;
  }
  
  .menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .menu-icon {
    margin-right: 8px;
    opacity: 0.8;
    width: 14px;
    height: 14px;
  }
  
  .delete {
    color: #f56565;
  }
  
  .delete .menu-icon {
    color: #f56565;
  }
  </style>