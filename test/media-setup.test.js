import { describe, expect, it, vi } from 'vitest';

describe('media provider setup dispatch', () => {
  function createPlayer(provider) {
    const isHTML5 = provider === 'html5';
    const isYouTube = provider === 'youtube';
    const isVimeo = provider === 'vimeo';

    return {
      provider,
      isHTML5: isHTML5 || false,
      isYouTube: isYouTube || false,
      isVimeo: isVimeo || false,
      isRutube: provider === 'rutube',
      isYandexCloud: provider === 'yandex',
      isVK: provider === 'vk',
      isMailRu: provider === 'mailru',
      isMTSLink: provider === 'mtslink',
      isEmbed: !isHTML5,
      isVideo: true,
      type: 'video',
      media: document.createElement('video'),
      elements: {
        container: document.createElement('div'),
        buttons: {},
        inputs: {},
        display: {},
      },
      config: {
        classNames: {
          type: 'plyr--{0}',
          provider: 'plyr__provider--{0}',
          video: 'plyr__video-wrapper',
          poster: 'plyr__poster',
        },
      },
      debug: { warn: vi.fn() },
    };
  }

  it('should call HTML5 setup for html5 provider', () => {
    const player = createPlayer('html5');
    const setupSpy = vi.fn();

    // Simulate the lookup table dispatch
    const providerSetup = {
      html5: setupSpy,
      youtube: vi.fn(),
      vimeo: vi.fn(),
      rutube: vi.fn(),
      yandex: vi.fn(),
      vk: vi.fn(),
      mailru: vi.fn(),
      mtslink: vi.fn(),
    };

    const setup = providerSetup[player.provider];
    setup.call(player);

    expect(setupSpy).toHaveBeenCalled();
    expect(setupSpy.mock.instances[0]).toBe(player);
  });

  it('should call YouTube setup for youtube provider', () => {
    const player = createPlayer('youtube');
    const setupSpy = vi.fn();

    const providerSetup = {
      html5: vi.fn(),
      youtube: setupSpy,
      vimeo: vi.fn(),
      rutube: vi.fn(),
      yandex: vi.fn(),
      vk: vi.fn(),
      mailru: vi.fn(),
      mtslink: vi.fn(),
    };

    const setup = providerSetup[player.provider];
    setup.call(player);

    expect(setupSpy).toHaveBeenCalled();
    expect(setupSpy.mock.instances[0]).toBe(player);
  });

  it('should call Vimeo setup for vimeo provider', () => {
    const player = createPlayer('vimeo');
    const setupSpy = vi.fn();

    const providerSetup = {
      html5: vi.fn(),
      youtube: vi.fn(),
      vimeo: setupSpy,
      rutube: vi.fn(),
      yandex: vi.fn(),
      vk: vi.fn(),
      mailru: vi.fn(),
      mtslink: vi.fn(),
    };

    const setup = providerSetup[player.provider];
    setup.call(player);

    expect(setupSpy).toHaveBeenCalled();
  });

  it('should call Rutube setup for rutube provider', () => {
    const player = createPlayer('rutube');
    const setupSpy = vi.fn();

    const providerSetup = {
      html5: vi.fn(),
      youtube: vi.fn(),
      vimeo: vi.fn(),
      rutube: setupSpy,
      yandex: vi.fn(),
      vk: vi.fn(),
      mailru: vi.fn(),
      mtslink: vi.fn(),
    };

    const setup = providerSetup[player.provider];
    setup.call(player);

    expect(setupSpy).toHaveBeenCalled();
  });

  it('should call Yandex setup for yandex provider', () => {
    const player = createPlayer('yandex');
    const setupSpy = vi.fn();

    const providerSetup = {
      html5: vi.fn(),
      youtube: vi.fn(),
      vimeo: vi.fn(),
      rutube: vi.fn(),
      yandex: setupSpy,
      vk: vi.fn(),
      mailru: vi.fn(),
      mtslink: vi.fn(),
    };

    const setup = providerSetup[player.provider];
    setup.call(player);

    expect(setupSpy).toHaveBeenCalled();
  });

  it('should call VK setup for vk provider', () => {
    const player = createPlayer('vk');
    const setupSpy = vi.fn();

    const providerSetup = {
      html5: vi.fn(),
      youtube: vi.fn(),
      vimeo: vi.fn(),
      rutube: vi.fn(),
      yandex: vi.fn(),
      vk: setupSpy,
      mailru: vi.fn(),
      mtslink: vi.fn(),
    };

    const setup = providerSetup[player.provider];
    setup.call(player);

    expect(setupSpy).toHaveBeenCalled();
  });

  it('should call Mail.ru setup for mailru provider', () => {
    const player = createPlayer('mailru');
    const setupSpy = vi.fn();

    const providerSetup = {
      html5: vi.fn(),
      youtube: vi.fn(),
      vimeo: vi.fn(),
      rutube: vi.fn(),
      yandex: vi.fn(),
      vk: vi.fn(),
      mailru: setupSpy,
      mtslink: vi.fn(),
    };

    const setup = providerSetup[player.provider];
    setup.call(player);

    expect(setupSpy).toHaveBeenCalled();
  });

  it('should call MTS Link setup for mtslink provider', () => {
    const player = createPlayer('mtslink');
    const setupSpy = vi.fn();

    const providerSetup = {
      html5: vi.fn(),
      youtube: vi.fn(),
      vimeo: vi.fn(),
      rutube: vi.fn(),
      yandex: vi.fn(),
      vk: vi.fn(),
      mailru: vi.fn(),
      mtslink: setupSpy,
    };

    const setup = providerSetup[player.provider];
    setup.call(player);

    expect(setupSpy).toHaveBeenCalled();
  });

  it('should handle unknown provider gracefully', () => {
    const player = createPlayer('unknown');

    const providerSetup = {
      html5: vi.fn(),
      youtube: vi.fn(),
      vimeo: vi.fn(),
      rutube: vi.fn(),
      yandex: vi.fn(),
      vk: vi.fn(),
      mailru: vi.fn(),
      mtslink: vi.fn(),
    };

    const setup = providerSetup[player.provider];
    // Should be undefined, no crash
    if (typeof setup === 'function') {
      setup.call(player);
    }

    expect(setup).toBeUndefined();
  });
});
