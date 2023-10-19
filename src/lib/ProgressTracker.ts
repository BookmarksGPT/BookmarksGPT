// TODO: DO NOT RETRY FAILED
// init db first time (same as full reset - this will eventually go in settings)
// add new bookmark
// update db with new stuff & fetch missing (and empty) descriptions || add new button for testing for now
export class ProgressTracker {
  total: any[];
  constructor(size: number) {
    this.total = Array(size).fill(false, 0, size);
    console.log(`ProgressTracker: ${this.total.length} initialized`);
  }

  updateProgress(index) {
    // update the total tracker
    this.total[index] = true;
    const completed = this.total.filter((t) => t === true);
    console.log(`updating index ${index} ${completed.length}/${this.total.length}`);
    return ~~((completed.length * 100) / this.total.length);
  }
}
