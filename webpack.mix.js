let mix = require('laravel-mix');

mix.js('example/app.js', 'example/app.dist.js');

mix.setPublicPath('example');
mix.disableNotifications();
