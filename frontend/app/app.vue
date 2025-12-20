<script setup>
import { ref, onUnmounted } from 'vue'
import { counterStore } from './store/counterStore'

const count = ref(counterStore.getState().count)

const unsubscribe = counterStore.subscribe((state) => {
  count.value = state.count
})

const { inc, dec, reset } = counterStore.getState()

onUnmounted(() => {
  unsubscribe()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4">
    <div class="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <h1 class="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-center">
        Nuxt 4 + Zustand
      </h1>
      
      <div class="flex flex-col items-center gap-6">
        <div class="text-7xl font-mono font-black tabular-nums tracking-tighter text-blue-500">
          {{ count }}
        </div>
        
        <div class="flex gap-4 w-full">
          <button 
            @click="dec"
            class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 border border-slate-700 shadow-lg"
          >
            -
          </button>
          
          <button 
            @click="inc"
            class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95"
          >
            +
          </button>
        </div>
        
        <button 
          @click="reset"
          class="text-slate-500 hover:text-slate-300 transition-colors uppercase text-xs font-bold tracking-widest mt-4"
        >
          Reset Counter
        </button>
      </div>

      <div class="mt-12 pt-8 border-t border-slate-800/50">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Tailwind CSS is active</span>
        </div>
      </div>
    </div>
    
    <div class="mt-8 text-slate-600 text-sm italic">
      Built with Nuxt 4 (compatibility mode)
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
</style>
