import { Component, Input } from '@angular/core';
import {eSpaceTitle} from '../utils/enum';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input({required: true}) currentSpace!: eSpaceTitle;
  protected readonly eSpaceTitle = eSpaceTitle;
  protected readonly isloggedIn: boolean = false;
}
