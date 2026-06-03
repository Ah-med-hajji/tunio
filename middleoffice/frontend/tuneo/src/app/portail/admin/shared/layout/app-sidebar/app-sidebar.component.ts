import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { SidebarWidgetComponent } from './app-sidebar-widget.component';
import { Subscription } from 'rxjs';

type SubItem = { name: string; path: string; roles?: string[] };
type NavItem = {
  name: string;
  icon: string;
  path?: string;
  subItems?: SubItem[];
  roles?: string[];
};

const ROLE_ADMIN = 'role_admin';
const ROLE_PARTNER = 'role_partner';
const ROLE_USER = 'role_user';

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe,
    SidebarWidgetComponent,
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent implements OnInit, OnDestroy {

  private static readonly ICON_DASHBOARD = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"></path></svg>`;

  private static readonly ICON_HOME = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.46 1.946a1 1 0 0 1 1.08 0l9 5.625A1 1 0 0 1 22 8.42V21a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1v-5h-5v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.42a1 1 0 0 1 .46-.85l9-5.624z" fill="currentColor"/></svg>`;

  private static readonly ICON_CATEGORIES = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 640 640"><path d="M24 48C10.7 48 0 58.7 0 72S10.7 96 24 96l45.3 0c3.9 0 7.2 2.8 7.9 6.6l52.1 286.3c6.2 34.2 36 59.1 70.8 59.1L456 448c13.3 0 24-10.7 24-24s-10.7-24-24-24l-256 0c-11.6 0-21.5-8.3-23.6-19.7L171.4 352 475 352c30.8 0 57.2-21.9 62.9-52.2l31-165.9C572.6 114.2 557.5 96 537.4 96L124.7 96l-.4-2c-4.8-26.6-28-46-55.1-46L24 48zM208 576c26.5 0 48-21.5 48-48s-21.5-48-48-48-48 21.5-48 48 21.5 48 48 48zM432 576c26.5 0 48-21.5 48-48s-21.5-48-48-48-48 21.5-48 48 21.5 48 48 48z" fill="currentColor"/></svg>`;

  private static readonly ICON_PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="currentColor"/></svg>`;

  private static readonly ICON_DOC = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2V3H9zm0 2h6v2H9zm-2 4h10v2H7zm0 4h7v2H7z"/></svg>`;

  private static readonly ICON_CALENDAR = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V3.75H15.25V2.75C15.25 2.33579 15.5858 2 16 2C16.4142 2 16.75 2.33579 16.75 2.75V3.75H18.5C19.7426 3.75 20.75 4.75736 20.75 6V9V19C20.75 20.2426 19.7426 21.25 18.5 21.25H5.5C4.25736 21.25 3.25 20.2426 3.25 19V9V6C3.25 4.75736 4.25736 3.75 5.5 3.75H7.25V2.75C7.25 2.33579 7.58579 2 8 2ZM8 5.25H5.5C5.08579 5.25 4.75 5.58579 4.75 6V8.25H19.25V6C19.25 5.58579 18.9142 5.25 18.5 5.25H16H8ZM19.25 9.75H4.75V19C4.75 19.4142 5.08579 19.75 5.5 19.75H18.5C18.9142 19.75 19.25 19.4142 19.25 19V9.75Z" fill="currentColor"/></svg>`;

  private static readonly ICON_USER = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25Z" fill="currentColor"/></svg>`;

  private static readonly ICON_HISTORY = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.5a8.5 8.5 0 1 0 7.86 11.79.75.75 0 1 1 1.39.57A10 10 0 1 1 22 12a.75.75 0 1 1-1.5 0A8.5 8.5 0 0 0 12 3.5z" fill="currentColor"/></svg>`;

  navItems: NavItem[] = [
    {
      icon: AppSidebarComponent.ICON_DASHBOARD,
      name: 'Dashboard',
      path: '/dashboard',
      roles: [ROLE_ADMIN, ROLE_PARTNER],
    },
    {
      icon: AppSidebarComponent.ICON_DASHBOARD,
      name: 'Mon tableau de bord',
      path: '/user/dashboard',
      roles: [ROLE_USER],
    },
    {
      icon: AppSidebarComponent.ICON_HOME,
      name: 'Découvrir',
      path: '/user/homepage',
      roles: [ROLE_USER],
    },
    {
      icon: AppSidebarComponent.ICON_DOC,
      name: 'Mes réservations',
      path: '/user/reservations',
      roles: [ROLE_USER],
    },
    {
      icon: AppSidebarComponent.ICON_CATEGORIES,
      name: 'Catégories',
      path: '/categories',
      roles: [ROLE_ADMIN],
    },
    {
      icon: AppSidebarComponent.ICON_PIN,
      name: 'Places',
      path: '/places',
      roles: [ROLE_ADMIN],
    },
    {
      icon: AppSidebarComponent.ICON_DOC,
      name: 'Demandes',
      path: '/demandes',
      roles: [ROLE_ADMIN],
    },
    {
      icon: AppSidebarComponent.ICON_DOC,
      name: 'Soumettre une demande',
      path: '/demande-form',
      roles: [ROLE_PARTNER],
    },
    {
      icon: AppSidebarComponent.ICON_HISTORY,
      name: 'Historique',
      path: '/historique',
      roles: [ROLE_USER],
    },
    {
      icon: AppSidebarComponent.ICON_USER,
      name: 'Mon profil',
      path: '/profile',
    },
  ];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit(): void {
    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(event.urlAfterRedirects || this.router.url);
        }
      }),
    );
    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    const url = (this.router.url || '').split('?')[0].split('#')[0];
    if (url === path) return true;
    return path !== '/' && url.startsWith(path + '/');
  }

  hasAccess(item: NavItem | SubItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    const current = localStorage.getItem('role');
    return current ? item.roles.includes(current) : false;
  }

  toggleSubmenu(section: string, index: number): void {
    const key = `${section}-${index}`;
    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
      return;
    }
    this.openSubmenu = key;
    setTimeout(() => {
      const el = document.getElementById(key);
      if (el) {
        this.subMenuHeights[key] = el.scrollHeight;
        this.cdr.detectChanges();
      }
    });
  }

  onSidebarMouseEnter(): void {
    this.isExpanded$
      .subscribe((expanded) => {
        if (!expanded) {
          this.sidebarService.setHovered(true);
        }
      })
      .unsubscribe();
  }

  onSubmenuClick(): void {
    this.isMobileOpen$
      .subscribe((isMobile) => {
        if (isMobile) {
          this.sidebarService.setMobileOpen(false);
        }
      })
      .unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string): void {
    this.navItems.forEach((nav, i) => {
      if (!nav.subItems) return;
      const match = nav.subItems.find((s) => this.isActive(s.path));
      if (!match) return;
      const key = `main-${i}`;
      this.openSubmenu = key;
      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    });
  }
}
