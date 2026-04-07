import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="snow-bg">
      <div *ngFor="let s of snowflakes" 
           class="snowflake"
           [style.left]="s.left + 'vw'"
           [style.width]="s.size + 'px'"
           [style.height]="s.size + 'px'"
           [style.animationDuration]="s.duration + 's'"
           [style.animationDelay]="s.delay + 's'">
      </div>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      position: relative;
      z-index: 1;
    }
  `]
})
export class AppComponent implements OnInit {
  snowflakes: any[] = [];

  ngOnInit() {
    this.snowflakes = Array.from({ length: 50 }).map(() => ({
      left: Math.random() * 100,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5
    }));
  }
}
