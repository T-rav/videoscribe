from abc import ABC, abstractmethod

class AbstractJobListener(ABC):
    @abstractmethod
    def listen(self, handler):
        pass

    @abstractmethod
    def publish_job_update(self, message):
        pass