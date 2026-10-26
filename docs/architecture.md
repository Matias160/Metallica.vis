# Arquitectura inicial

El backend expone una API REST bajo `/api`. La aplicación móvil consumirá esa API y conservará localmente únicamente la sesión necesaria para volver a autenticarse.

La regla central del dominio es que un dubbeo crea una nueva copia, incrementa la generación y registra una entrada de linaje. Las copias originales se conservan para que la historia sea auditable.
