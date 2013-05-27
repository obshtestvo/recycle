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


### Installing requirements

```sh
sudo apt-get install nginx-full uwsgi uwsgi-plugin-python python-pip && sudo pip install django virtualenvwrapper
```

### App setup

```sh
django-admin.py startproject recycle
mkvirtualenv recycle --no-site-packages #this will create a virtual environment at ~/.virtualenvs/recycle
workon recycle
pip install django # even if you have django, install it in the virtual env
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
