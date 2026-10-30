(() => {
  /* NOTE (perf fix): this module previously re-fetched /api/v1/lunar-month at
     +1100 ms and again on every state/date/month interaction, duplicating the
     lunar-month fetch + caption that loadMonthGrid() already performs and
     re-rendering #calTitle a second time (content pop-in, extra ~400 ms of
     astronomy on the main thread per interaction). The duplicate pipeline was
     removed — the calendar meta line (regional month + lunar month + system)
     is rendered once by loadMonthGrid(). */
})();
