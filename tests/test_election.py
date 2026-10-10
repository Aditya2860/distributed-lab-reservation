import pytest
from unittest.mock import patch, MagicMock
from node_service.app.algorithms.leader_election import BullyElection

@pytest.fixture
def mock_election():
    with patch('node_service.app.algorithms.leader_election.OTHER_NODES', ["http://localhost:8002", "http://localhost:8003"]):
        with patch('node_service.app.algorithms.leader_election.NODE_ID', "node-a"):
            with patch('node_service.app.algorithms.leader_election.PRIORITY', 10):
                with patch('node_service.app.algorithms.leader_election.HIGHER_PRIORITY_NODES', ["http://localhost:8002"]):
                    election = BullyElection()
                    yield election

def test_election_initialization(mock_election):
    assert mock_election.coordinator_id is None
    assert not mock_election.is_coordinator

def test_receive_coordinator_message(mock_election):
    mock_election.receive_message({"type": "COORDINATOR", "sender_id": "node-c", "priority": 30})
    assert mock_election.coordinator_id == "node-c"
    assert not mock_election.is_coordinator

@patch('requests.post')
def test_start_election_no_higher_priority(mock_post, mock_election):
    # Simulate requests timing out or returning errors
    mock_post.side_effect = Exception("Connection refused")
    
    mock_election.trigger_election()
    
    # The election sets it as coordinator because no higher priority node responded
    assert mock_election.is_coordinator
    assert mock_election.coordinator_id == "node-a"

@patch('requests.post')
def test_start_election_higher_priority_responds(mock_post, mock_election):
    # Simulate a successful response from a higher priority node
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_post.return_value = mock_response
    
    mock_election.trigger_election()
    
    # If a higher priority node responds, it waits for a coordinator message
    assert not mock_election.is_coordinator

