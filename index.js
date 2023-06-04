'use strict';

const Hapi = require('@hapi/hapi');
const { nanoid } = require('nanoid');

const app = Hapi.server({
    port: 9000,
    host: 'localhost'
});

// Array untuk menyimpan data buku
const books = [];

// Route untuk menyimpan buku
app.route({
    method: 'POST',
    path: '/books',
    handler: (request, h) => {
    // Mendapatkan data dari body request
        const {
            name, year, author, summary, publisher, pageCount, readPage, reading
        } = request.payload;

        // Client tidak melampirkan properti name
        if (!name) {
            return h.response({
                status: 'fail',
                message: 'Gagal menambahkan buku. Mohon isi nama buku'
            }).code(400);
        }

        // Client melampirkan nilai readPage yang lebih besar dari nilai pageCount
        if (readPage > pageCount) {
            return h.response({
                status: 'fail',
                message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount'
            }).code(400);
        }

        // Generate ID menggunakan nanoid
        const id = nanoid(16);

        // Menyimpan data buku ke dalam array books
        const insertedAt = new Date().toISOString();
        const updatedAt = insertedAt;
        const finished = pageCount === readPage;

        const newBook = {
            id,
            name,
            year,
            author,
            summary,
            publisher,
            pageCount,
            readPage,
            finished,
            reading,
            insertedAt,
            updatedAt
        };

        books.push(newBook);

        return h.response({
            status: 'success',
            message: 'Buku berhasil ditambahkan',
            data: {
                bookId: id
            }
        }).code(201);
    }
});

// Route untuk menampilkan seluruh buku
app.route({
    method: 'GET',
    path: '/books',
    handler: (request, h) => {
    // Cek apakah terdapat buku yang disimpan
        if (books.length === 0) {
            return h.response({
                status: 'success',
                data: {
                    books: []
                }
            }).code(200);
        }

        // Mendapatkan nilai query parameters
        const { name, reading, finished } = request.query;

        // Filter buku berdasarkan query parameters
        let filteredBooks = [...books];

        if (name) {
            const searchKeyword = name.toLowerCase();
            filteredBooks = filteredBooks.filter((book) => book.name.toLowerCase().includes(searchKeyword));
        }

        if (reading) {
            const isReading = reading === '1';
            filteredBooks = filteredBooks.filter((book) => book.reading === isReading);
        }

        if (finished) {
            const isFinished = finished === '1';
            filteredBooks = filteredBooks.filter((book) => book.finished === isFinished);
        }

        // Jika terdapat buku setelah proses filtering, kirim data buku
        if (filteredBooks.length > 0) {
            const formattedBooks = filteredBooks.map((book) => ({
                id: book.id,
                name: book.name,
                publisher: book.publisher
            }));

            return h.response({
                status: 'success',
                data: {
                    books: formattedBooks
                }
            }).code(200);
        }

        // Bila tidak ada buku setelah proses filtering,
        // kirim respons dengan status 200 dan data buku kosong

        return h.response({
            status: 'success',
            data: {
                books: []
            }
        }).code(200);
    }
});

// Route untuk menampilkan detail buku
app.route({
    method: 'GET',
    path: '/books/{bookId}',
    handler: (request, h) => {
    // Dapatkan nilai bookId dari parameter URL
        const { bookId } = request.params;

        // Cari buku berdasarkan bookId
        const foundBook = books.find((book) => book.id === bookId);

        // Bila buku tidak ditemukan, kirim respons dengan status 404
        if (!foundBook) {
            return h.response({
                status: 'fail',
                message: 'Buku tidak ditemukan'
            }).code(404);
        }

        // Bila buku ditemukan, kirim respons dengan status 200
        return h.response({
            status: 'success',
            data: {
                book: foundBook
            }
        }).code(200);
    }
});

// Route untuk mengubah data buku
app.route({
    method: 'PUT',
    path: '/books/{bookId}',
    handler: (request, h) => {
    // Dapatkan nilai bookId dari parameter URL
        const { bookId } = request.params;

        // Dapatkan data buku yang akan diubah
        const bookIndex = books.findIndex((book) => book.id === bookId);

        // Bila buku tidak ditemukan, kirim respons dengan status 404
        if (bookIndex === -1) {
            return h.response({
                status: 'fail',
                message: 'Gagal memperbarui buku. Id tidak ditemukan'
            }).code(404);
        }

        // Dapatkan data buku yang dikirim oleh client
        const {
            name, year, author, summary, publisher, pageCount, readPage, reading
        } = request.payload;

        // Cek apakah client melampirkan properti name pada request body
        if (!name) {
            return h.response({
                status: 'fail',
                message: 'Gagal memperbarui buku. Mohon isi nama buku'
            }).code(400);
        }

        // Cek apakah readPage lebih besar dari pageCount
        if (readPage > pageCount) {
            return h.response({
                status: 'fail',
                message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount'
            }).code(400);
        }

        // Perbarui data buku
        books[bookIndex] = {
            ...books[bookIndex],
            name,
            year,
            author,
            summary,
            publisher,
            pageCount,
            readPage,
            reading
        };

        // Kirim respons dengan status 200
        return h.response({
            status: 'success',
            message: 'Buku berhasil diperbarui'
        }).code(200);
    }
});

// Route untuk menghapus buku
app.route({
    method: 'DELETE',
    path: '/books/{bookId}',
    handler: (request, h) => {
    // Dapatkan nilai bookId dari parameter URL
        const { bookId } = request.params;

        // Dapatkan indeks buku yang akan dihapus
        const bookIndex = books.findIndex((book) => book.id === bookId);

        // Bila buku tidak ditemukan, kirim respons dengan status 404
        if (bookIndex === -1) {
            return h.response({
                status: 'fail',
                message: 'Buku gagal dihapus. Id tidak ditemukan'
            }).code(404);
        }

        // Hapus buku dari array books
        books.splice(bookIndex, 1);

        // Kirim respons dengan status 200
        return h.response({
            status: 'success',
            message: 'Buku berhasil dihapus'
        }).code(200);
    }
});

// Start the server
const init = async () => {

    await app.start();
    console.log(`Server berjalan pada ${app.info.uri}`);
};

init().catch((err) => {

    console.error(err);
    process.exit(1);
});
