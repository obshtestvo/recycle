class VerboseException(Exception):
    pass


class VerboseRedirectException(VerboseException):
    def __init__(self, message):
        super(VerboseRedirectException, self).__init__(message)
        self.errors = {}
        self.redirect = {
            "name": None,
            "vars": {}
        }

    def get_errors(self):
        return self.errors

    def set_errors(self, errors):
        """
        @errors: {}
        Dictionary of errors
        """
        self.errors = errors
        return self

    def add_error(self, name, message):
        try:
            self.errors[name]
        except:
            self.errors[name] = []
        self.errors[name].append(message)
        return self

    def get_redirect(self):
        return self.redirect

    def set_redirect(self, name, **kwargs):
        """
        @errors: {}
        Dictionary redirect's name and vars
        """
        self.redirect = {
            "name": name,
            "vars": kwargs
        }
        return self

