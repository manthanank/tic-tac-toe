import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { TrackService } from './services/track.service';
import { Visit } from './models/visit.model';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'tic-tac-toe';

  // Game state using signals
  board = signal<string[]>(Array(9).fill(''));
  currentPlayer = signal<string>('X');
  winner = signal<string | null>(null);
  isDarkTheme = signal<boolean>(false);

  // Visitor count state
  visitorCount = signal<number>(0);
  isVisitorCountLoading = signal<boolean>(false);
  visitorCountError = signal<string | null>(null);

  private trackService = inject(TrackService);

  // Computed values
  isDraw = computed(
    () => !this.winner() && this.board().every((cell) => cell !== '')
  );

  constructor() {
    // Apply theme changes whenever isDarkTheme changes
    effect(() => {
      const isDark = this.isDarkTheme();
      if (isDark) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      // Save to localStorage whenever theme changes
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  ngOnInit() {
    // Try to load the theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme.set(savedTheme === 'dark');
    this.trackVisit();
  }

  private trackVisit(): void {
    this.isVisitorCountLoading.set(true);
    this.visitorCountError.set(null);

    this.trackService.trackProjectVisit(this.title).subscribe({
      next: (response: Visit) => {
        this.visitorCount.set(response.uniqueVisitors);
        this.isVisitorCountLoading.set(false);
      },
      error: (err: Error) => {
        console.error('Failed to track visit:', err);
        this.visitorCountError.set('Failed to load visitor count');
        this.isVisitorCountLoading.set(false);
      },
    });
  }

  makeMove(index: number): void {
    // Use immutable update pattern with signals
    if (this.board()[index] === '' && !this.winner()) {
      const newBoard = [...this.board()];
      newBoard[index] = this.currentPlayer();
      this.board.set(newBoard);

      if (this.checkWinner(newBoard)) {
        this.winner.set(this.currentPlayer());
      } else {
        // Toggle player
        this.currentPlayer.set(this.currentPlayer() === 'X' ? 'O' : 'X');
      }
    }
  }

  checkWinner(board: string[]): boolean {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    return winningCombinations.some(
      ([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]
    );
  }

  resetGame(): void {
    this.board.set(Array(9).fill(''));
    this.currentPlayer.set('X');
    this.winner.set(null);
  }

  toggleTheme(): void {
    this.isDarkTheme.update((value) => !value);
  }
}
