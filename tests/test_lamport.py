import pytest
from node_service.app.algorithms.lamport_clock import LamportClock

def test_lamport_clock_initialization():
    clock = LamportClock()
    assert clock.get_time() == 0

def test_lamport_clock_increment():
    clock = LamportClock()
    ts1 = clock.increment()
    assert ts1 == 1
    ts2 = clock.increment()
    assert ts2 == 2

def test_lamport_clock_update_with_older_time():
    clock = LamportClock()
    clock.increment() # clock is 1
    clock.update(0)   # updating with older time
    assert clock.get_time() == 2 # max(1, 0) + 1

def test_lamport_clock_update_with_newer_time():
    clock = LamportClock()
    clock.increment() # clock is 1
    clock.update(5)   # updating with newer time
    assert clock.get_time() == 6 # max(1, 5) + 1
