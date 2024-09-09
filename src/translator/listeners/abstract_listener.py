from abc import ABC, abstractmethod

class AbstractListener(ABC):
    @abstractmethod
    def listen(self, handler):
        pass