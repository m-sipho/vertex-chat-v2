import pytest
from fastapi import HTTPException
from app.api.rooms.dependencies import Room_Manager
from app.api.auth.schemas import User

@pytest.fixture
def manager():
    return Room_Manager()

@pytest.fixture
def host():
    return User(username="HostUser", id="host_unique_id")

@pytest.fixture
def thabang():
    return User(username="user_thabang", id="thabang_unique_id")

@pytest.fixture
def banele():
    return User(username="user_banele", id="banele_unique_id")

@pytest.mark.asyncio
async def test_create_and_join_flow(manager, host, thabang):
    """Test creating a room and a user joining it"""
    # Host creates room
    response = await manager.create_room(host)
    room_code = response['room_code']
    assert room_code in manager._active_rooms

    # Thabang requests to join
    result = await manager.request_to_join_room(thabang, room_code)
    assert result['status'] == 'pending'

    # Host approves Thabang
    approve_result = await manager.approve_user(host.id, room_code, thabang.username)
    assert approve_result['status'] == 'approved'

    # Verify Thabang is active
    room = manager._active_rooms[room_code]
    assert thabang.id in room['active_users']
    assert thabang.id not in room['pending_users']

@pytest.mark.asyncio
async def test_host_maximum_room_creation(manager, host):
    """Test when a host creates more than one rooms"""
    room_a = await manager.create_room(host)
    room_code_1 = room_a['room_code']
    assert room_code_1 in manager._active_rooms

    with pytest.raises(HTTPException) as excinfo:
        await manager.create_room(host)

    assert excinfo.value.status_code == 400 # Bad request
    assert str(excinfo.value.detail) == "You can only host up to one room."

@pytest.mark.asyncio
async def test_maximum_room_limit(manager, host, thabang, banele):
    """Test that a user cannot join more than two rooms"""
    # Create 3 rooms
    room_1 = await manager.create_room(host)
    room_code_1 = room_1['room_code']

    room_2 = await manager.create_room(thabang)
    room_code_2 = room_2['room_code']

    room_3 = await manager.create_room(banele)
    room_code_3 = room_3['room_code']

    # Host joins room_2
    await manager.request_to_join_room(host, room_code_2)

    # Host joins room_3
    with pytest.raises(HTTPException) as excinfo:
        await manager.request_to_join_room(host, room_code_3)
    
    assert excinfo.value.status_code == 403
    assert str(excinfo.value.detail) == "cannot join more than 2 rooms"

    # Thabang approves host
    await manager.approve_user(thabang.id, room_code_2, host.username)

    # Host joins room_3
    with pytest.raises(HTTPException) as excinfo:
        await manager.request_to_join_room(host, room_code_3)
    
    assert excinfo.value.status_code == 403
    assert str(excinfo.value.detail) == "cannot join more than 2 rooms"

@pytest.mark.asyncio
async def test_reject_user_logic(manager, host, banele):
    """Test the host rejecting a user"""
    # Host creates room
    room = await manager.create_room(host)
    room_code = room['room_code']

    # Banele requests to join
    await manager.request_to_join_room(banele, room_code)

    # Host rejects Banele (Case insensetive)
    result = await manager.reject_user(host.id, room_code, banele.username)

    assert result['status'] == 'removed'
    current_room = manager._active_rooms[room_code]
    assert banele.id not in current_room['pending_users']

@pytest.mark.asyncio
async def test_host_succession(manager, host, banele, thabang):
    """Test that the host should select the successor before leaving"""
    # Host creates room
    room = await manager.create_room(host)
    room_code = room['room_code']

    # Banele and Thabang join the host's room
    await manager.request_to_join_room(banele, room_code)
    await manager.request_to_join_room(thabang, room_code)

    # Host approves Banele and Thabang
    await manager.approve_user(host.id, room_code, banele.username)
    await manager.approve_user(host.id, room_code, thabang.username)

    current_room = manager._active_rooms[room_code]

    # Verify the Host is 'host'
    assert current_room['host_id'] == host.id

    # Host leaves and assigns thabang as successor
    result = await manager.leave_room(user_id=host.id, room_code=room_code, new_host_id=thabang.id)

    assert result['status'] == 'left'
    assert "user_thabang is now the host" in result['message']
    assert current_room['host_id'] == thabang.id
    assert host.id not in current_room['active_users']

@pytest.mark.asyncio
async def test_garbage_collection_on_leave(manager, host):
    """Test that when the room has no one when the host leaves, delete the room"""
    # Host creates room
    room = await manager.create_room(host)
    room_code = room['room_code']

    current_room = manager._active_rooms[room_code]

    # Host leaves and assigns thabang as successor
    result = await manager.leave_room(user_id=host.id, room_code=room_code)

    assert result['status'] == 'deleted'
    assert "Host left and room was empty" in result['message']
    assert room_code not in manager._active_rooms