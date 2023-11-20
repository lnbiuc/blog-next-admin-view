<template>
  <div flex flex-row items-center justify-center gap-2 text-xl>
    <nav inline-lex mt-6>
      <button icon-btn @click="toggleDark()">
        <div i-carbon-sun dark:i-carbon-moon />
      </button>

      <a
        i-carbon-logo-github icon-btn
        rel="noreferrer"
        href="https://github.com/antfu/vitesse-lite"
        target="_blank"
        title="GitHub"
        class="ml-4"
      />
    </nav>
  </div>
</template>
