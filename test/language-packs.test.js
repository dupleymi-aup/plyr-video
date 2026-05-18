// Tests for i18n language packs
import { describe, it, expect } from 'vitest';
import { ru, de, fr, es, it as itPack, pt, zh } from '../src/i18n/index.js';

describe('i18n language packs', () => {
  describe('Russian (ru)', () => {
    it('has play translation', () => {
      expect(ru.play).toBe('Воспроизвести');
    });
    it('has pause translation', () => {
      expect(ru.pause).toBe('Пауза');
    });
    it('has settings translation', () => {
      expect(ru.settings).toBe('Настройки');
    });
    it('has loop translations', () => {
      expect(ru.loop).toBe('Повтор');
      expect(ru.loopOn).toBe('Вкл');
      expect(ru.loopOff).toBe('Выкл');
      expect(ru.loopAll).toBe('Повтор всего');
    });
    it('has error translations', () => {
      expect(ru.errorTitle).toBe('Ошибка воспроизведения');
      expect(ru.errorNetwork).toBeTruthy();
    });
    it('has qualityBadge values', () => {
      expect(ru.qualityBadge[2160]).toBe('4K');
      expect(ru.qualityBadge[1080]).toBe('HD');
    });
  });

  describe('German (de)', () => {
    it('has play translation', () => {
      expect(de.play).toBe('Wiedergabe');
    });
    it('has pause translation', () => {
      expect(de.pause).toBe('Pause');
    });
    it('has settings translation', () => {
      expect(de.settings).toBe('Einstellungen');
    });
    it('has loop translations', () => {
      expect(de.loop).toBe('Wiederholung');
      expect(de.loopOn).toBe('An');
      expect(de.loopOff).toBe('Aus');
      expect(de.loopAll).toBe('Alles wiederholen');
    });
  });

  describe('French (fr)', () => {
    it('has play translation', () => {
      expect(fr.play).toBe('Reproduire');
    });
    it('has pause translation', () => {
      expect(fr.pause).toBe('Pause');
    });
    it('has settings translation', () => {
      expect(fr.settings).toBe('Paramètres');
    });
    it('has loop translations', () => {
      expect(fr.loop).toBe('Répéter');
      expect(fr.loopOn).toBe('Activé');
      expect(fr.loopOff).toBe('Désactivé');
      expect(fr.loopAll).toBe('Tout répéter');
    });
  });

  describe('Spanish (es)', () => {
    it('has play translation', () => {
      expect(es.play).toBe('Reproducir');
    });
    it('has pause translation', () => {
      expect(es.pause).toBe('Pausar');
    });
    it('has settings translation', () => {
      expect(es.settings).toBe('Ajustes');
    });
    it('has loop translations', () => {
      expect(es.loop).toBe('Repetir');
      expect(es.loopOn).toBe('Activado');
      expect(es.loopOff).toBe('Desactivado');
      expect(es.loopAll).toBe('Repetir todo');
    });
  });

  describe('Italian (it)', () => {
    it('has play translation', () => {
      expect(itPack.play).toBe('Riproduci');
    });
    it('has pause translation', () => {
      expect(itPack.pause).toBe('Pausa');
    });
    it('has settings translation', () => {
      expect(itPack.settings).toBe('Impostazioni');
    });
    it('has loop translations', () => {
      expect(itPack.loop).toBe('Ripeti');
      expect(itPack.loopOn).toBe('Attivo');
      expect(itPack.loopOff).toBe('Disattivo');
      expect(itPack.loopAll).toBe('Ripeti tutto');
    });
  });

  describe('Portuguese (pt)', () => {
    it('has play translation', () => {
      expect(pt.play).toBe('Reproduzir');
    });
    it('has pause translation', () => {
      expect(pt.pause).toBe('Pausar');
    });
    it('has settings translation', () => {
      expect(pt.settings).toBe('Configurações');
    });
    it('has loop translations', () => {
      expect(pt.loop).toBe('Repetir');
      expect(pt.loopOn).toBe('Ativado');
      expect(pt.loopOff).toBe('Desativado');
      expect(pt.loopAll).toBe('Repetir tudo');
    });
  });

  describe('Chinese (zh)', () => {
    it('has play translation', () => {
      expect(zh.play).toBe('播放');
    });
    it('has pause translation', () => {
      expect(zh.pause).toBe('暂停');
    });
    it('has settings translation', () => {
      expect(zh.settings).toBe('设置');
    });
    it('has loop translations', () => {
      expect(zh.loop).toBe('循环');
      expect(zh.loopOn).toBe('开');
      expect(zh.loopOff).toBe('关');
      expect(zh.loopAll).toBe('全部循环');
    });
  });
});
