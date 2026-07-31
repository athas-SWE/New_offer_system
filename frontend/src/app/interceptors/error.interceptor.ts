import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
      } else if (error.status === 403) {
        void router.navigate(['/']);
      }
      const message =
        (error.error && (error.error.message as string)) ||
        error.message ||
        'Something went wrong. Please try again.';
      return throwError(() => new Error(message));
    })
  );
};
