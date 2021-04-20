import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Head from 'next/head';

import { RichText } from 'prismic-dom';
import Link from 'next/link';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useEffect, useState } from 'react';


interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState(results)
  const [hasMorePosts, setHasMorePosts] = useState(!!postsPagination.next_page);

  return (
    <>
      <Head>
        <title>Inicio | sg.news</title>
      </Head>

      <main className={styles.container}>
        <img src="spacetraveling.svg" alt="logo" />
        <div className={styles.posts}>
          {posts.map(post => (
            <div key={post.uid}>
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <FiCalendar />
                    <span>{
                      format(
                        new Date(post.first_publication_date),
                        "dd MMM yyyy",
                        {
                          locale: ptBR,
                        }
                      )}
                    </span>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </a>
              </Link>
            </div>
          ))}

          {hasMorePosts &&
            (
              <button
                onClick={loadMorePosts}
              >
                Carregar mais posts
              </button>
            )
          }
        </div>
      </main>
    </>
  )

  async function loadMorePosts() {
    await fetch(next_page)
      .then(response => response.json())
      .then(data => {
        //Salvo nos posts o antigo estado + o novo post
        //setPosts(oldState => [...oldState, ...data.results])
        setPosts([...posts, ...data.results])
      })
    //E no final da função fetchNext você faria isso:
    setHasMorePosts(postsPagination.next_page === null)
  }
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 1,
  })

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })
  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      }
    }
  }
};
