
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import React from 'react';
import Header from '../../components/Header';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'



import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FILE } from 'node:dns';
import { useRouter } from 'next/router';

interface Post {
  uid: string | null;
  subtitle: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {

  const total =
    post.data.content.reduce((sumTotal, content) => {
      const sumWordsHeading = String(content.heading).split(/[\s]+/);
      const sumWordsBody = RichText.asText(content.body).split(/[\s]+/);
      sumTotal += sumWordsHeading.length + sumWordsBody.length;
      return sumTotal;
    }, 0);

  const router = useRouter();

  return (
    <>
      <Head>
        <title>sgnews.posts</title>
      </Head>
      <Header />
      <main className={`${commonStyles.container}`}>
        {router.isFallback ?
          (<h1>Carregando...</h1>)
          :
          (
            <>
              <div className={`${commonStyles.content} ${styles.content}`}>
                <h1>{post.data.title}</h1>

                <div className={commonStyles.postInfo}>
                  <time><FiCalendar />{
                    format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy', { locale: ptBR }
                    )}</time>
                  <span><FiUser />{post.data.author}</span>
                  <time><FiClock />{Math.ceil(total / 200)} min</time>
                </div>
                {
                  post.data.content.map(item => (
                    <div key={item.heading} className={styles.post}>
                      <h2>{item.heading}</h2>

                      {item.body.map(paragraph => (
                        <p key={Math.random()}>{paragraph.text}</p>
                      ))}
                    </div>
                  ))
                }
              </div>
            </>
          )}
      </main>
    </>
  )
}


export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 2,
    }
  );

  // Get the paths we want to pre-render based on posts
  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    fetch: ['post.subtitle', 'post.title', 'post.banner', 'post.author', 'post.content'],
  });

  const post =
  {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    }
  }


  return {
    props: { post }
  }


};
