import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

/**
 * Lightweight smoke placeholder.
 * Full e2e requires a running MySQL instance with schema applied.
 */
describe('AppController (e2e)', () => {
  it('placeholder — configure DB then enable AppModule bootstrap', () => {
    expect(true).toBe(true);
  });
});
