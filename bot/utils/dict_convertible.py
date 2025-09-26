def dict_convertible(cls):
    # Функция для превращения экземпляра класса в словарь
    def to_dict(self):
        return {key: getattr(self, key) for key in self.__dict__}

    # Классовый метод для создания экземпляра класса из словаря
    @classmethod
    def from_dict(cls, data):
        instance = cls.__new__(cls)
        for key, value in data.items():
            setattr(instance, key, value)
        return instance

    # Добавляем методы к классу
    cls.to_dict = to_dict
    cls.from_dict = from_dict
    return cls
