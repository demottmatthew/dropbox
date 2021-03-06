<template>
  <div class="tabs-component">
    <div class="tabs">
      <ul role="tablist" class="tabs-component-tabs">
        <li v-for="tab in tabs"
            :class="{ 'is-active': tab.isActive }"
            class="tabs-component-tab"
            role="presentation"
            v-show="tab.isVisible">
          <a v-html="tab.header"
             :aria-controls="tab.hash"
             :aria-selected="tab.isActive"
             @click="selectTab(tab.hash, $event)"
             :href="tab.hash"
             class="tabs-component-tab-a"
             role="tab"></a>
        </li>
      </ul>
    </div>
    <div class="tabs-component-panels">
      <slot/>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      cacheLifetime: { default: 5 },
      options: {
        type: Object,
        required: false,
        default: () => ({
          useUrlFragment: false
        })
      }
    },
    data: () => ({
      tabs: [],
      activeTabHash: ''
    }),
    created () {
      this.tabs = this.$children
    },
    mounted () {
      window.addEventListener('hashchange', () => this.selectTab(window.location.hash))
      if (this.findTab(window.location.hash)) {
        this.selectTab(window.location.hash)
        return
      }
      if (this.tabs.length) {
        this.selectTab(this.tabs[0].hash)
      }
    },
    methods: {
      findTab (hash) {
        return this.tabs.find(tab => tab.hash === hash)
      },
      selectTab (selectedTabHash, event) {
        // See if we should store the hash in the url fragment.
        if (event && !this.options.useUrlFragment) {
          event.preventDefault()
        }
        const selectedTab = this.findTab(selectedTabHash)
        if (!selectedTab) {
          return
        }
        this.tabs.forEach(tab => {
          tab.isActive = (tab.hash === selectedTab.hash)
        })
        this.$emit('changed', { tab: selectedTab })
        this.activeTabHash = selectedTab.hash
      },
      setTabVisible (hash, visible) {
        const tab = this.findTab(hash)
        if (!tab) {
          return
        }
        tab.isVisible = visible
        if (tab.isActive) {
          // If tab is active, set a different one as active.
          tab.isActive = visible
          this.tabs.every((tab, index, array) => {
            if (tab.isVisible) {
              tab.isActive = true
              return false
            }
            return true
          })
        }
      }
    }
  }
</script>
