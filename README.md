# RE:CYCLE

## Есенция
Карта с пунктове, депа, места са хвърляне на батерии, скрап, и (ако има) други. Всеки посетител ще има възможността да добави нов пункт. Вече има идеи за допълнителни функционалности в бъдещи версии.

### Примерни употреби

#### Пример №1
1. Петър има купка стари списания, вестници и изписани тетрадки
1. Петър предпочита да не мята всичко това в кофата за рециклиране, понеже нерядко кофата е замърсявана с органичен боклук и не бива рециклирана
1. Петър влиза в сайта и търси "хартия" 
1. RE:CYCLE показва близките до Петър пунктове за рециклиране на хартия, базирайки това по автоматично засечения адреса 
1. Петър избира най-ведро изглеждащия от пунктовеете и занася събраната хартия

### Пример №2 (графичен)
Прототипен дизайн, добавяне на пункт стъпка 2:
![add-location-2](https://f.cloud.github.com/assets/4492376/563904/24a22988-c524-11e2-89f3-9e787c60ce43.jpg)

## Планирано в първата версия/издание
https://docs.google.com/document/d/1zinC_iEABr7-FLKzZWNhTXp3DxhgUaNKqynUTVxed7I/edit?usp=sharing

## Следваща версия
 - От карта да стане търсачка. Да може да си въвеждат адреса посетителите.
 - Да има начин сайта да извежда идеини предложения тип [Какво мога да направя с моите ___ (30 празни бутилки,старо радио ...)___ ?](https://github.com/obshtestvo/what-should-i-do) с помощта на които хората могат да се справят с излищните вещи типа "направи си сам", да си "измайстрят" нещо от привидно непотребните вещи
 - още в горния документ описващ включеното във версия 1

## Инсталация (за програмисти)

### Изисквания
 - nginx server
 - uwsgi server
 - uwsgi python plugin
 - pip (python package manager)
 - django
 - virtualenvwrapper
 - mysql driver and its dependencies

#### Инсталация на изискванията (на debian-базирана машина)

```sh
sudo apt-get install nginx-full uwsgi uwsgi-plugin-python python-pip && sudo pip install django virtualenvwrapper
```
и за mysql:

```sh
sudo apt-get install libmysqlclient-dev python-dev
```

### Инсталация на проекта

```sh
django-admin.py startproject recycle
mkvirtualenv recycle --no-site-packages #this will create a virtual environment at ~/.virtualenvs/recycle
workon recycle
pip install django # even if you have django, install it in the virtual env
pip install mysql-python # mysql...
sudo ln -s ~/.virtualenvs/recycle/lib/python2.7/site-packages/django/contrib/admin/static/admin ./static/
```

### Подкарване
#### Когато още се разработва

```
django-admin.py runserver --settings=settings --pythonpath=/home/ubuntu/projects/recycle  --insecure

```

#### Когато вече сайта е готов и е пуснат / Production server
Редактирайте домейна в `settings_nginx.optimised.conf` и `settings_nginx.basic.conf`.

##### Настройки за `nginx`

```sh
# basic (no caching, no tweaking):
sudo ln -s /home/ubuntu/projects/recycle/server/settings_nginx.basic.conf /etc/nginx/sites-enabled/recycle.conf
# optimised
sudo ln -s /home/ubuntu/projects/recycle/server/settings_nginx.optimised.conf /etc/nginx/sites-enabled/recycle.conf
```

Които се активират с :
```sh
sudo service nginx restart
```

##### Настройки за `uwsgi`
```sh
# debian/ubuntu/mint...:
sudo ln -s /home/ubuntu/projects/recycle/server/settings_uwsgi.ini /etc/uwsgi/apps-enabled/recycle.ini
# fedora/centos/redhat...
sudo ln -s /home/ubuntu/projects/recycle/server/settings_uwsgi.ini /etc/uwsgi.d/recycle.ini
```

Които се активират с :
```
sudo service uwsgi restart
```

##### Опресняване на направени промени

```
sudo service uwsgi reload && sudo service nginx reload
```

##### Забележки
*Следното трябва да се премести в конфигурационен файл*:

- Edit `/ecomap/templates/home/get.html` to specify the ignorable address parts. Usually this project will be integrated in a specific region, so you can safely remove this region from the addresses being displayed.
- Edit `/ecomap/templates/home/get.html` to specify the default map center.