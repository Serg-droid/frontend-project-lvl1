document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    //глобальная переменная, кеширует полученную инфу о фильмах, чтобы не делать много запросов на сервер
    let dataAboutHeroes;

    const setStorage = (data) => {
        localStorage.setItem('heroInfo', data);
        document.cookie = `dataLength=${data.length}`;
    };
    //отправляет ajax запросы
    const makeRequest = () => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '../dbHeroes/dbHeroes.json');
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.addEventListener('readystatechange', () => {
                if(xhr.readyState !== 4){
                    return;
                }
                if(xhr.status === 200){
                    resolve(xhr.responseText);
                }else{
                    reject(`Ошибка при загрузке данных: ${xhr.status}`);
                }
            });

            xhr.send();

        });
    };

    //заполняет попап 
    const fillPopup = (info) => {
        const   popupImg = document.querySelector('.popup-img'),
                popup = document.querySelector('.popup');

        info.photo = info.photo.replace(/(?<=\.jpg)\//, '');
        popupImg.style.cssText = `background-image: url('../dbHeroes/${info.photo}')`;
        popup.addEventListener('click', (e) => {
            if(!e.target.matches('.popup-img')){
                popup.style.display = 'none';
            }
        });
    };

    //создает карточку одного персонажа
    const showHero = (info) => {
        const   allHeroesItem = document.createElement('div'),
                allHeroesItemImage = document.createElement('div'),
                allHeroesListInfo = document.createElement('ul'),
                allHeroesButton = document.createElement('button'),
                showWideButton = document.createElement('button'),
                listInfoWrapper = document.createElement('div');

        const wrapper = document.querySelector('.all-heroes__wrapper');

        //более удобное добавление классов, передается двумерный массив, в каждом из подмассивов первое значение -- обрабатываемый элемент
        const addClass = (doubleMas) => {
            doubleMas.forEach(mas => {
                const arrOfClasses = mas.slice(1);
                const tag = mas[0];
                arrOfClasses.forEach(className => tag.classList.add(className));
            })
        };

        addClass([
            [allHeroesButton, 'btn', 'all-heroes__button'],
            [allHeroesItem, 'all-heroes__item'],
            [showWideButton, 'btn', 'btn-show-wide'],
            [allHeroesItemImage, 'all-heroes__item-img'],
            [allHeroesListInfo, 'all-heroes__listinfo'],
            [listInfoWrapper, 'all-heroes__listinfo-wrapper']
        ]);
        
        //добавление текста
        allHeroesButton.textContent = 'Подробнее';
        showWideButton.textContent = 'Посмотреть на большую фотку';

        //навешиваем обработчики событий
        showWideButton.addEventListener('click', () => {
            fillPopup(info);
            document.querySelector('.popup').style.display = 'block';
        });

        //добавление бэк-картинки
        info.photo = info.photo.replace(/(?<=\.jpg)\//, '');
        allHeroesItemImage.style.cssText = `background-image: url('../dbHeroes/${info.photo}')`;

        //создание списка личной информации о герое
        for(const [key, value] of Object.entries(info)){
            if(key === 'photo') continue;
            const li = document.createElement('li');
            li.classList.add('all-heroes__listinfo-item');
            li.innerHTML = `<span>${key}</span> - ${value}`;
            allHeroesListInfo.append(li);
        }

        //рендер эл-ов на страницу
        const appendElements = (elemTo, arrOfElems) => {
            arrOfElems.forEach(elem => elemTo.append(elem));
        };

        listInfoWrapper.append(allHeroesListInfo);
        appendElements(allHeroesItem, [allHeroesItemImage, showWideButton, allHeroesButton, listInfoWrapper]);
        wrapper.append(allHeroesItem);
    };

    //создает карточки персонажей
    const showAllHeroes = (data) => {
        JSON.parse(data).forEach(hero => {
            showHero(hero);
        });
    };

    //заполняет options в фильтре
    const showFilterOptions = (allHeroes) => {
        const filterSelect = document.querySelector('.filter__select');
        const filmSet = new Set();
        for(const hero of JSON.parse(allHeroes)){
            if(hero.movies){
                hero.movies.forEach(movie => filmSet.add(movie));
            }
        }
        const sortedFilmSet = [...filmSet].sort((a, b) => a > b ? 1 : -1);
        const fragment = document.createDocumentFragment();
        sortedFilmSet.forEach(film => {
            const option = document.createElement('option');
            option.textContent = film;
            option.value = film;
            fragment.append(option);
        });
        filterSelect.append(fragment);
    };

    //получение и обработка данных из json
    const dataProcess = () => {
        const data = localStorage.getItem('heroInfo');
        if(data && +document.cookie.match(/dataLength=[0-9]*/)[0].split('=')[1] === data.length){
            showAllHeroes(data);
            showFilterOptions(data);
            dataAboutHeroes = JSON.parse(data);
            setStorage(data);
            return;
        }
        makeRequest()
            .then(response => {
                showAllHeroes(response);
                showFilterOptions(response);
                dataAboutHeroes = JSON.parse(response);
                setStorage(response);
                return response;
            })
            .catch(error => console.warn(error));
    };
    dataProcess();

    //фильтрует фильмы
    const filter = (e) => {
        const allHeroesWrapper = document.querySelector('.all-heroes__wrapper');

        const filmName = e.target.value;
        const heroesFromFilm = dataAboutHeroes.filter(hero => {
            if(hero.movies){
                for(const movie of hero.movies){
                    if(filmName === movie) return true;
                }
            }
            return false;
        });
        //очистка страницы для перерисовки
        while(allHeroesWrapper.firstChild){
            allHeroesWrapper.removeChild(allHeroesWrapper.firstChild);
        }
        heroesFromFilm.forEach(hero => showHero(hero));
    };

    //устанавливает свойства фильтра на дом-элементы
    const setFilters = () => {
        const filterSelect = document.querySelector('.filter__select');
        filterSelect.addEventListener('change', filter);
    };
    setFilters();
});