import { Component } from '@angular/core';
import { LucideArrowUpRight, LucideDisc3 } from '@lucide/angular';

@Component({
  selector: 'scw-footer',
  standalone: true,
  imports: [LucideArrowUpRight, LucideDisc3],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
