class ItemNaoEncontrado(Exception):
    """Exceção global para qualquer recurso que não for achado no banco"""
    pass


class NaoAutenticado(Exception):
    """Exceção para usuario não autenticado"""
    pass    