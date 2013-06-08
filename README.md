## RE:CYCLE

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

Recycling Spots - Recycling spots nearby you, проект от https://docs.google.com/spreadsheet/ccc?key=0AoQEIaPHnvx6dHVWTDJIUDBrN0FEOURzMUZaRnFTTXc

## Includes
**...да се допише...**

## Requirements
 - nginx server
 - uwsgi server
 - uwsgi python plugin
 - pip (python package manager)
 - django
 - virtualenvwrapper
 - mysql driver and its dependencies

### Installing requirements

```sh
sudo apt-get install nginx-full uwsgi uwsgi-plugin-python python-pip && sudo pip install django virtualenvwrapper
```
and for the capricious MySQL:

```sh
sudo apt-get install libmysqlclient-dev python-dev
```

### App setup

```sh
django-admin.py startproject recycle
mkvirtualenv recycle --no-site-packages #this will create a virtual environment at ~/.virtualenvs/recycle
workon recycle
pip install django # even if you have django, install it in the virtual env
pip install mysql-python # mysql...
```

Enable "recycle" in `nginx` server:
```sh
# in development:
sudo ln -s /home/ubuntu/web/recycle/recycle.dev.nginx /etc/nginx/sites-enabled/
# in production
sudo ln -s /home/ubuntu/web/recycle/recycle.nginx /etc/nginx/sites-enabled/
```

And then to activate:
```sh
sudo service nginx restart
```

Enable & activate "recycle" in the `uwsgi` server:
```sh
sudo ln -s /home/ubuntu/web/recycle/recycle.uwsgi /etc/uwsgi/apps-enabled/recycle.ini
sudo service uwsgi restart
```

**...да се допише...**

## Опресняване на направени промени

Докато сайта е още в разработка може да се изпълни:

```
sudo service uwsgi restart && sudo service nginx restart
```
