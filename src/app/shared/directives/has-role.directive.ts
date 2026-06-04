// en este archivo se define una directiva estructural llamada HasRoleDirective que se utiliza para mostrar u ocultar elementos del DOM en función de los roles del usuario autenticado. La directiva se suscribe a los cambios en el usuario actual a través del AuthService y actualiza la vista según los roles permitidos especificados en la plantilla.

import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private allowedRoles: UserRole[] = [];
  private hasView = false;
  private subscription?: Subscription;

  @Input('appHasRole')
  set roles(value: UserRole | UserRole[]) {
    this.allowedRoles = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    const canShow = this.authService.hasRole(this.allowedRoles);

    if (canShow && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
      return;
    }

    if (!canShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
