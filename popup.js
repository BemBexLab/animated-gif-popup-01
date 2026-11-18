document.addEventListener('alpine:init', () => {
  Alpine.data('wurizipPopup', () => ({
    ready: false,
    isOpen: true,
    step: 1,
    declined: false,
    interest: null,
    content: null,
    loadError: '',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    get options() {
      return this.content?.options ?? [];
    },
    get progressLabel() {
      if (!this.content) return '';
      const progress = this.content.progress;
      return this.declined ? progress.declined : progress.template
        .replace('{step}', this.step)
        .replace('{total}', progress.total);
    },
    get selected() {
      return this.options.find(option => option.id === this.interest);
    },
    get message() {
      if (!this.content) return {};
      const messages = this.content.messages;
      if (this.declined) return messages.declined;
      if (this.step === 1) return messages.intro;
      if (this.step === 2) return messages.topics;
      return { eyebrow: messages.resultEyebrow, title: this.selected.title, description: this.selected.description };
    },
    init() {
      this.$watch('isOpen', () => this.syncVideos());
      this.$watch('step', () => this.syncVideos());
      this.$watch('declined', () => this.syncVideos());
      this.onMotionChange = () => this.syncVideos();
      this.reducedMotion.addEventListener('change', this.onMotionChange);
      this.loadContent();
    },
    // Replace this URL with a Laravel endpoint returning the same JSON structure when integrating.
    async loadContent() {
      this.loadError = '';
      try {
        const response = await fetch('./dummy.json');
        if (!response.ok) throw new Error('dummy.json: HTTP ' + response.status);
        this.content = await response.json();
        this.interest = this.options[0]?.id ?? null;
        document.title = this.content.pageTitle;
        this.ready = true;
        this.syncVideos();
      } catch (error) {
        this.loadError = error.message;
        console.error(error);
      }
    },
    destroy() {
      this.reducedMotion.removeEventListener('change', this.onMotionChange);
    },
    // Respect reduced-motion preferences and pause hidden animations.
    syncVideos() {
      this.$nextTick(() => {
        const active = this.step === 1 && !this.declined ? 'wave' : 'blink';
        ['wave', 'blink'].forEach(name => {
          const video = this.$refs[name];
          if (!video) return;
          video.muted = true;
          if (this.isOpen && name === active && !this.reducedMotion.matches) {
            video.play().catch(() => { /* A blocked autoplay leaves the first frame visible. */ });
          } else video.pause();
        });
      });
    },
    focusStep() {
      this.$nextTick(() => this.$refs.stepTitle?.focus({ preventScroll: true }));
    },
    advance() { this.step = 2; this.focusStep(); },
    choose(id) { this.interest = id; this.step = 3; this.focusStep(); },
    decline() { this.declined = true; this.focusStep(); },
    back() {
      if (this.declined) this.declined = false;
      else this.step = Math.max(1, this.step - 1);
      this.focusStep();
    },
    openPopup() { this.isOpen = true; this.focusStep(); },
    closePopup() {
      this.isOpen = false;
      this.$nextTick(() => this.$refs.launcher?.focus({ preventScroll: true }));
    },
  }));
});
