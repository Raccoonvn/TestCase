// App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Карта
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

const API_URL = 'https://ofc-test-01.tspb.su/test-task/vehicles'; 

function App() {
  const [cars, setCars] = useState([]);
  const [newCar, setNewCar] = useState({
    name: '',
    model: '',
    year: '',
    color: '',
    price: ''
  });
  const [editingCar, setEditingCar] = useState(null);
  const [sortBy, setSortBy] = useState('year');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCreateForm, setShowCreateForm] = useState(false); 
  const editFormRef = useRef(null);
  const map = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Функция для показа ошибки
  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Загрузка списка машин
  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('GET-запрос заблокирован (405). API недоступено.');
        }
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      const data = await response.json();
      setCars(data);
    } catch (error) {
      console.error('Ошибка при загрузке машин:', error);
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Создание новой машины
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCar)
      });
      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('POST-запрос заблокирован (405). Создание машины недоступно.');
        }
        throw new Error(`Ошибка создания: ${response.status}`);
      }
      fetchCars(); // Reload после успеха
      setNewCar({ name: '', model: '', year: '', color: '', price: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка при создании машины:', error);
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Редактирование машины
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingCar) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_URL}/${editingCar.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCar.name,
          price: editingCar.price
        })
      });
      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('PATCH-запрос заблокирован (405). Редактирование машины недоступно.');
        }
        throw new Error(`Ошибка редактирования: ${response.status}`);
      }
      fetchCars();
      setEditingCar(null);
    } catch (error) {
      console.error('Ошибка при редактировании машины:', error);
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление машины
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту машину?')) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('DELETE-запрос заблокирован (405). Удаление машины недоступно.');
        }
        throw new Error(`Ошибка удаления: ${response.status}`);
      }
      fetchCars();
    } catch (error) {
      console.error('Ошибка при удалении машины:', error);
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка изменений в форме создания
  const handleNewCarChange = (e) => {
    setNewCar({ ...newCar, [e.target.name]: e.target.value });
  };

  // Обработка изменений в форме редактирования
  const handleEditingCarChange = (e) => {
    setEditingCar({ ...editingCar, [e.target.name]: e.target.value });
  };

  // Сортировка машин
  const sortedCars = [...cars].sort((a, b) => {
    if (sortBy === 'year') {
      return sortOrder === 'asc' ? a.year - b.year : b.year - a.year;
    } else if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    }
    return 0;
  });

  // Открытие формы редактирования и скролл к ней
  const openEditForm = (car) => {
    setEditingCar({ id: car.id, name: car.name, price: car.price });
    editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openMap = () => {
    map.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="App">
      <h1>Управление машинами</h1>

      {/* Ошибка или загрузка */}
      {errorMessage && <div className="error">{errorMessage}</div>}
      {isLoading && <div className="loading">Загрузка...</div>}

      {/* Кнопка пролистываня до карты */}
      <div className="button-container">
        <button className="btn btn-primary" onClick={() => openMap()}>
          Карта машин
        </button>
      </div>

      {/* Кнопка для показа формы создания */}
      <div className="button-container">
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Скрыть форму' : 'Добавить новую машину'}
        </button>
      </div>

      {/* Форма создания машины (показывается только при showCreateForm = true) */}
      {showCreateForm && (
        <div className="form-container">
          <h2>Создать новую машину</h2>
          <form onSubmit={handleCreate} className="form">
            <input name="name" placeholder="Марка машины" value={newCar.name} onChange={handleNewCarChange} required />
            <input name="model" placeholder="Модель машины" value={newCar.model} onChange={handleNewCarChange} required />
            <input name="year" type="number" placeholder="Год производства" value={newCar.year} onChange={handleNewCarChange} required />
            <input name="color" placeholder="Цвет" value={newCar.color} onChange={handleNewCarChange} required />
            <input name="price" type="number" placeholder="Стоимость" value={newCar.price} onChange={handleNewCarChange} required />
            <button type="submit" className="btn btn-success">Создать</button>
          </form>
        </div>
      )}

      {/* Форма редактирования */}
      {editingCar && (
        <div ref={editFormRef} className="form-container">
          <h2>Редактировать машину (ID: {editingCar.id})</h2>
          <form onSubmit={handleEdit} className="form">
            <input name="name" placeholder="Марка машины" value={editingCar.name} onChange={handleEditingCarChange} required />
            <input name="price" type="number" placeholder="Цена машины" value={editingCar.price} onChange={handleEditingCarChange} required />
            <button type="submit" className="btn btn-success">Сохранить</button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingCar(null)}>Отмена</button>
          </form>
        </div>
      )}

      {/* Сортировка */}
      <div className="sort-container">
        <h2>Сортировка:</h2>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select">
          <option value="year">По году</option>
          <option value="price">По цене</option>
        </select>
        <h2>Упорядочивание:</h2>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="select">
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
      </div>

      {/* Список машин */}
      <h2>Список машин</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Марка машины</th>
            <th>Модель машины</th>
            <th>Год производства</th>
            <th>Цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedCars.map(car => (
            <tr key={car.id}>
              <td>{car.name}</td>
              <td>{car.model}</td>
              <td>{car.year}</td>
              <td>{car.price}</td>
              <td>
                <button className="btn btn-edit" onClick={() => openEditForm(car)}>Редактировать</button>
                <button className="btn btn-delete" onClick={() => handleDelete(car.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedCars.length === 0 && <p className="no-data">Нет машин для отображения</p>}

      {/* Карта с маркерами машин */}
      {sortedCars.length > 0 && (
        <div ref={map} className="map-container">
          <h2>Карта расположения машин</h2>
          <YMaps>
            <Map
              state={{ center: [55.75, 37.62], zoom: 5, controls: ['zoomControl', 'fullscreenControl']}}
              style={{ width: '100%', height: '400px' }}
              options={{
                suppressMapOpenBlock: true 
              }}
              modules={["control.ZoomControl", "control.FullscreenControl"]}
            >
            <Placemark
              modules={["geoObject.addon.balloon"]}
              defaultGeometry={[55.75, 37.57]}
            />
              {sortedCars
                .filter(car => car.latitude && car.longitude)
                .map(car => (
                  <Placemark
                    key={car.id}
                    geometry={[car.latitude, car.longitude]}
                    properties={{
                      hintContent: `${car.name} ${car.model}`,
                      balloonContent: `
                        <div style="font-family: Arial; font-size: 14px;">
                          <strong>${car.name} ${car.model}</strong><br />
                          Год: ${car.year}<br />
                          Цена: $${car.price}<br />
                          Цвет: ${car.color}<br />
                          Координаты: ${car.latitude.toFixed(4)}, ${car.longitude.toFixed(4)}
                        </div>
                      ` 
                    }}
                    options={{
                      preset: 'islands#redIcon', 
                      openBalloonOnClick: true, 
                      openHintOnHover: true, 
                      iconColor: '#ff0000', 
                      hasBalloon: true, 
                      hasHint: true
                    }}
                  />
                ))}
            </Map>
          </YMaps>
        </div>
      )}
    </div>
  );
}

export default App;